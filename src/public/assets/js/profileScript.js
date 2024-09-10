const socket = io();

function previewImage() {
  const fileInput = document.getElementById("profilePictureInput");
  const imagePreview = document.getElementById("imagePreview");
  const cancelButtonContainer = document.getElementById("cancelButtonContainer");

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = document.createElement("img");
      image.src = event.target.result;
      image.style.maxWidth = "175px";
      image.style.maxHeight = "175px";

      imagePreview.innerHTML = "";
      imagePreview.appendChild(image);
      cancelButtonContainer.innerHTML = `<button class="btn btn-danger" style="padding: 0.2rem 0.4rem; border-radius: 50%; margin: 0.4rem; font-size: 1.5em;" onclick="cancelImageSelection()"><i class="bi bi-x" id="btnCerrar" aria-hidden="true"></i></button>`;
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    imagePreview.innerHTML = `<i class="bi bi-image" style="font-size:100px"></i>`;
    cancelButtonContainer.innerHTML = "";
  }
}

function cancelImageSelection() {
  const fileInput = document.getElementById("profilePictureInput");
  const imagePreview = document.getElementById("imagePreview");
  const cancelButtonContainer = document.getElementById("cancelButtonContainer");

  if (fileInput) fileInput.value = "";
  if (imagePreview) imagePreview.innerHTML = `<i class="bi bi-image" style="font-size:100px"></i>`;
  if (cancelButtonContainer) cancelButtonContainer.innerHTML = "";
}

function uploadFile(type, inputId, docType) {
  const input = document.getElementById(inputId);
  const file = input.files[0];
  const idElement = document.getElementById("ID");
  const userId = idElement ? idElement.textContent.trim() : null;

  if (!file) {
    Toastify({
      userDocumentsElement,
      text: "Por favor, seleccione al menos un archivo.",
      style: {
        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
      },
    }).showToast();
    return;
  }

  if (!userId) {
    console.error("No se pudo obtener el ID del usuario.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("docType", docType);
  let url = `/api/users/${userId}/documents?type=${type}`;
  if (docType) {
    url += `&document_type=${docType}`;
  }

  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      Toastify({
        text: "Archivo subido exitosamente",
        style: {
          background: "#28a745",
        },
      }).showToast();


      socket.emit("documentUploadSuccess", { userId: userId, documentType: docType });
      if (docType === "avatar") {
        updateProfilePic();
      }
      
      const fileInput = document.getElementById(inputId);
      if (fileInput) fileInput.value = "";
      if (inputId === "profilePictureInput") {
        cancelImageSelection();
      }
    })
    .catch((error) => {
      console.error("Error al subir el archivo:", error);
      Toastify({
        text: "Error al subir el archivo",
        style: {
          background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
      }).showToast();
    });
}


function updateDocumentStatus(documents) {
  if (!Array.isArray(documents)) {
    console.error("Expected an array for documents, but got:", documents);
    documents.forEach(doc => {
      const statusElement = document.getElementById(`status-${doc.docType}`);
      if (statusElement) {
        statusElement.innerText = "Recibido";
        statusElement.classList.remove("bg-danger");
        statusElement.classList.add("bg-success");
      }
    });
    return;
  }

  function updateStatus(docType, statusElementId) {
    const statusElement = document.getElementById(statusElementId);

    if (!statusElement) {
      console.error("Elemento no encontrado para:", statusElementId);
      return;
    }

    const found = documents.some((d) => d.docType === docType);

    if (found) {
      statusElement.textContent = "Listo";
      statusElement.classList.remove("bg-danger");
      statusElement.classList.add("bg-success");
    } else {
      statusElement.textContent = "Faltante";
      statusElement.classList.remove("bg-success");
      statusElement.classList.add("bg-danger");
    }
  }



updateStatus("ID", "status-ID");
updateStatus("adress", "status-adress");
updateStatus("statement", "status-statement");
}

socket.on("documentsUpdated", ({ userId, documents }) => {
  updateDocumentStatus(documents);

});

async function updateUserRole() {
  const userRoleElement = document.getElementById("userRole");
  const userRoleElement2 = document.getElementById("user-role");
  const userIdElement = document.getElementById("ID");
  const userId = userIdElement ? userIdElement.textContent.trim() : null;
  const toggleButton = document.getElementById("btn-premium");

  if (userRoleElement && userId) {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      const users = data.users;
      const user = users.find((user) => user._id === userId);

      if (user) {
        userRoleElement.textContent = user.rol;
        userRoleElement2.textContent = user.rol;
        if (toggleButton) {
          if (user.rol === "usuario") {
            toggleButton.innerHTML = '<i class="bi bi-star me-2"></i> Actualizar a Premium';
          } else if (user.rol === "premium") {
            toggleButton.innerHTML = '<i class="bi bi-person-fill"></i> Actualizar a Usuario';
          }
        }
      } else {
        console.log("Usuario no encontrado");
      }
    } catch (error) {
      console.log("Error al actualizar el rol del usuario:", error);
    }
  }
}

function updateProfilePic() {
  const profilePic = document.getElementById("profilePic");
  const profilePic2 = document.getElementById("currentProfilePic");
  const userIdElement = document.getElementById("ID");
  const userId = userIdElement ? userIdElement.textContent.trim() : null;
  if (profilePic && userId) {
    profilePic.src = `/img/profiles/${userId}/ProfilePic?${new Date().getTime()}`;
    profilePic2.src = `/img/profiles/${userId}/ProfilePic?${new Date().getTime()}`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const id = document.getElementById("ID");
  const userDocumentsElement = document.getElementById("documents");
  const documentsJson = userDocumentsElement.getAttribute("data-documents");

  let user = {};

  if (documentsJson) {
    try {
      const user = JSON.parse(documentsJson);
      const userDocuments = user.documents || [];
      updateDocumentStatus(userDocuments);
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  } else {
    console.error("documentsJson está vacío o no se encuentra.");
  }


  const userDocuments = user.documents || [];

  updateDocumentStatus(userDocuments);

  document.getElementById("btn-upload-profile-pic").addEventListener("click", () => {
    uploadFile("document", "profilePictureInput", "avatar");
  });

  document.getElementById("btn-upload-identification").addEventListener("click", () => {
    uploadFile("document", "identificationInput", "ID");
  });

  document.getElementById("btn-upload-address").addEventListener("click", () => {
    uploadFile("document", "upload-addressInput", "adress");
  });

  document.getElementById("btn-upload-account-statement").addEventListener("click", () => {
    uploadFile("document", "accountStatementInput", "statement");
  });

  document.querySelectorAll(".list-group-item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#F0E68C";
    });
    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "";
    });
  });

  const btnPremium = document.getElementById("btn-premium");
  if (btnPremium) {
    btnPremium.addEventListener("click", async function () {
      const userId = this.getAttribute("data-user-id");
      try {
        const response = await fetch(`/api/users/premium/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();

        if (response.ok) {
          Toastify({
            text: "El rol del usuario ha sido actualizado exitosamente.",
            duration: 2000,
            gravity: "top",
            position: "right",
            style: {
              background: "#28a745",
            },
          }).showToast();
          updateUserRole();
        } else {
          Toastify({
            text: `Error: ${result.message}`,
            duration: 2000,
            gravity: "top",
            position: "right",
            style: {
              background: "#dc3545",
            },
          }).showToast();
        }
      } catch (error) {
        console.error("Error al actualizar el rol del usuario:", error);
        Toastify({
          text: "Error al actualizar el rol del usuario.",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: {
            background: "#dc3545",
          },
        }).showToast();
      }
    });
  }
});