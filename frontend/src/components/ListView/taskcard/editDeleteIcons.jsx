import React, { useState } from "react";
import DeletePopup from "../../common/deletepopup";
import "bootstrap/dist/css/bootstrap.min.css";

function EditDeleteIcons({ task, fetchTasks,onEdit }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Icons Section */}
      <div className="d-flex flex-column col-auto text-center">
        <i className="bi bi-pencil-square btn btn-outline-primary mb-2" onClick={onEdit}></i>
        <i
          className="bi bi-trash3 btn btn-outline-danger"
          onClick={() => setShowModal(true)} // Open modal
        ></i>
      </div>

      {/* Conditional Rendering of DeletePopup */}
      {showModal && (
        <DeletePopup
          task={task}
          fetchTasks={fetchTasks}
          onclose={setShowModal} // Close modal handler
        />
      )}
    </>
  );
}

export default EditDeleteIcons;
