const express = require('express');
const router = express.Router();
const helpers = require('../helper/helpers');
const contactHelpers = require('../helper/contactHelper')
const { parse, Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');


router.post('/get_table_data', async (req, res) => {
  try {
    let table_name = req.body.table_name;
    // Execute the main query
    let result = await helpers.get_names(table_name,"*")
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all contacts with optional filters
router.get('/', async (req, res) => {
    try {
      // Execute the main query
      const results = await contactHelpers.get_contacts(req)
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Get a single contact by ID
router.get('/:id', async (req, res) => {
    try {
        // Execute the main query
        const results = await contactHelpers.get_contact_details(req)
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    
  });

//insert new contact
router.post('/', async (req, res) => {
    try {
      const results = await contactHelpers.add_new_contact(req)
      res.status(200).json({ message: 'Contact added successfully', id: results.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

//edit contact
router.put('/:id', async (req, res) => {
  try {
      // Execute the main query
      const results = await contactHelpers.update_contact(req)
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json({ message: 'Contact updated successfully' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
  
});

// Delete a contact by ID
router.delete('/:id', async (req, res) => {
  try {
    const id =req.params.id;
    const result = await helpers.deleterow(id,'contact','id');

    res.json(result);
  } catch (err) {
      res.status(500).json({ error: err });
  }
});

// Export contacts as CSV
router.get('/export/csv', async (req, res) => {
  try {
      // Fetch all contacts from the database
      const contacts_json = await contactHelpers.get_contacts(req);
      let contacts = contacts_json.data[0]
      // Convert JSON data to CSV format
      if (contacts.length === 0) {
        return res.status(404).json({ message: 'No contacts found to export.' });
      }
  
      // Specify fields to include in the CSV
      const fields = Object.keys(contacts[0]).filter(
        (field) => !['city_id', 'state_id', 'country_id', 'industry_id'].includes(field)
      );
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(contacts);
      
      // Set headers to prompt file download
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
      res.setHeader('Content-Type', 'text/csv');

      // Send the CSV data as a response
      res.send(csv);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Set up multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// router.post('/import/csv', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const filePath = req.file.path;
//     const skippedRecords = [];
//     const processedRecords = [];
//     const errorsFilePath = `uploads/errors_${Date.now()}.csv`;
//     const countryNames = new Set();
//     const industryNames = new Set();
//     let totalRecords = 0;

//     // Read the CSV file and collect unique names for bulk ID mapping
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => {
//         if (row.country) countryNames.add(row.country);
//         if (row.industry) industryNames.add(row.industry);
//         totalRecords++;
//       })
//       .on('end', async () => {
//         try {
//           // Fetch IDs for countries, industries, and lead statuses
//           const [countryIdMap, industryIdMap] = await Promise.all([
//             helpers.getIdsByNames('country', [...countryNames]),
//             helpers.getIdsByNames('industry', [...industryNames]),
//           ]);

//           // Re-read the CSV to process each row
//           const processingPromises = [];
//           fs.createReadStream(filePath)
//             .pipe(csv())
//             .on('data', (row) => {
//               const rowPromise = (async () => {
//                 try {
//                   // Validate required fields
//                   if (!row.email || !row.first_name || !row.last_name) {
//                     skippedRecords.push({
//                       record: row,
//                       reason: 'Missing required fields (email, first_name, last_name)',
//                     });
//                     return;
//                   }

//                   // Map foreign keys
//                   const countryId = countryIdMap[row.country] || null;
//                   const industryId = industryIdMap[row.industry] || null;

//                   // Skip records with missing foreign key mappings
//                   if (row.country && !countryId) {
//                     skippedRecords.push({
//                       record: row,
//                       reason: 'Foreign key mapping failed for Country',
//                     });
//                     return;
//                   }
//                   if (row.industry && !industryId) {
//                     skippedRecords.push({
//                       record: row,
//                       reason: 'Foreign key mapping failed for Industry',
//                     });
//                     return;
//                   }

//                   // Check for duplicate email
//                   const [existingContact] = await helpers.findContactByEmail(row.email);
//                   if (existingContact) {
//                     skippedRecords.push({
//                       record: row,
//                       reason: 'Email already exists',
//                     });
//                     return;
//                   }

//                   // Insert valid record into the database
//                   await helpers.insertContact({
//                     email: row.email,
//                     first_name: row.first_name,
//                     last_name: row.last_name,
//                     phone_number: row.phone_number || null,
//                     company_name: row.company_name || null,
//                     country_id: countryId,
//                     industry_id: industryId,
//                     assigned_to: row.assigned_to || null,
//                     lead_source: row.lead_source || null,
//                     job_title: row.job_title || null,
//                     linked_in: row.linked_in || null,
//                     address: row.address || null,
//                     website: row.website || null,
//                     company_hq: row.company_hq || null,
//                     notes: row.notes || null,
//                   });

//                   processedRecords.push(row);
//                 } catch (err) {
//                   skippedRecords.push({
//                     record: row,
//                     reason: `Error: ${err.message}`,
//                   });
//                 }
//               })();
//               processingPromises.push(rowPromise);
//             })
//             .on('end', async () => {
//               try {
//                 // Wait for all processing tasks to complete
//                 await Promise.all(processingPromises);

//                 // Write skipped records to CSV
//                 const writeStream = fs.createWriteStream(errorsFilePath);
//                 writeStream.write('email,first_name,last_name,phone,company,reason\n');
//                 skippedRecords.forEach(({ record, reason }) => {
//                   const recordValues = Object.values(record).join(',');
//                   writeStream.write(`${recordValues},${reason}\n`);
//                 });
//                 writeStream.end();

//                 // Clean up uploaded file
//                 fs.unlinkSync(filePath);

//                 // Respond with results
//                 res.json({
//                   message: 'Contacts imported successfully with some skipped records',
//                   totalRecords,
//                   processedCount: processedRecords.length,
//                   skippedCount: skippedRecords.length,
//                   skippedRecordsFile: errorsFilePath,
//                 });
//               } catch (err) {
//                 res.status(500).json({ error: `Error processing records: ${err.message}` });
//               }
//             })
//             .on('error', (err) => {
//               res.status(500).json({ error: `Error reading CSV file: ${err.message}` });
//             });
//         } catch (err) {
//           res.status(500).json({ error: `Error processing CSV: ${err.message}` });
//         }
//       })
//       .on('error', (err) => {
//         res.status(500).json({ error: `Error reading CSV file: ${err.message}` });
//       });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
  
module.exports = router