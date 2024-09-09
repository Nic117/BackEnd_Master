const socket = io();


function previewImage() {
    const fileInput = document.getElementById("profilePictureInput");
    const imagePreview = document.getElementById("imagePreview");
    const cancelButtonContainer = document.getElementById("cancelButtonContainer");

    if (fileInput?.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const image = document.createElement("img");
            image.src = event.target.result;
            image.style.maxWidth = "175px";
            image.style.maxHeight = "175px";
            imagePreview.innerHTML = "";
            imagePreview.appendChild(image);
            cancelButtonContainer.innerHTML = "";
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        resetImagePreview(imagePreview, cancelButtonContainer);
    }
}


function resetImagePreview(imagePreview, cancelButtonContainer) {
    imagePreview.innerHTML = "";
    cancelButtonContainer.innerHTML = "";
}


function cancelImageSelection() {
    const fileInput = document.getElementById("profilePictureInput");
    resetImagePreview(document.getElementById("imagePreview"), document.getElementById("cancelButtonContainer"));
    if (fileInput) fileInput.value = "";
}


async function uploadFile(type, inputId, docType) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    const userId = document.getElementById("ID")?.textContent.trim();

    if (!file) {
        showToast("Seleccione al menos un archivo.", "error");
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
    if (docType) url += `&document_type=${docType}`;

    try {
        const response = await fetch(url, { method: "POST", body: formData });
        const data = await response.json();
        console.log("Respuesta de la subida de archivo:", data);
        showToast("Archivo subido exitosamente", "success");
        socket.emit("documentUploadSuccess", { userId, documentType: docType });
        if (docType === "avatar") updateProfilePic();
        if (inputId === "profilePictureInput") cancelImageSelection();
    } catch (error) {
        console.error("Error al subir el archivo:", error);
        showToast("Error al subir el archivo", "error");
    }
}

function showToast(message, type) {
    const styles = {
        success: { background: "#28a745" },
        error: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" }
    };
    Toastify({ text: message, style: styles[type] }).showToast();
}

function updateDocumentStatus(documents) {
    if (!Array.isArray(documents)) {
        console.error("Expected an array for documents, but got:", documents);
        return;
    }

    documents.forEach(doc => {
        const statusElement = document.getElementById(`status-${doc.docType}`);
        if (statusElement) {
            statusElement.innerText = "Recibido";
            statusElement.classList.remove("bg-danger");
            statusElement.classList.add("bg-success");
        }
    });
}

async function updateUserRole() {
    const userId = document.getElementById("ID")?.textContent.trim();
    const toggleButton = document.getElementById("btn-premium");

    if (userId) {
        try {
            const response = await fetch("/api/users");
            const data = await response.json();
            const user = data.users.find(user => user._id === userId);
            if (user) {
                document.getElementById("userRole").textContent = user.rol;
                document.getElementById("user-role").textContent = user.rol;
                toggleButton.innerHTML = user.rol === "usuario" ? 'Actualizar a Premium' : 'Actualizar a Usuario';
            }
        } catch (error) {
            console.error("Error al actualizar el rol del usuario:", error);
        }
    }
}


function updateProfilePic() {
    const userId = document.getElementById("ID")?.textContent.trim();
    const profilePic = document.getElementById("profilePic");
    const profilePic2 = document.getElementById("currentProfilePic");

    if (userId) {
        const timestamp = new Date().getTime();
        profilePic.src = `/img/profiles/${userId}/ProfilePic?${timestamp}`;
        profilePic2.src = `/img/profiles/${userId}/ProfilePic?${timestamp}`;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const userDocumentsElement = document.getElementById("documents");
    const documentsJson = userDocumentsElement.getAttribute("data-documents");

    if (documentsJson) {
        try {
            const user = JSON.parse(documentsJson.replace(/"/g, '"'));
            updateDocumentStatus(user.documents || []);
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    } else {
        console.error("documentsJson está vacío o no se encuentra.");
    }

    document.getElementById("btn-upload-profile-pic").addEventListener("click", () => uploadFile("document", "profilePictureInput", "avatar"));
    document.getElementById("btn-upload-identification").addEventListener("click", () => uploadFile("document", "identificationInput", "ID"));
    document.getElementById("btn-upload-address").addEventListener("click", () => uploadFile("document", "upload-addressInput", "adress"));
    document.getElementById("btn-upload-account-statement").addEventListener("click", () => uploadFile("document", "accountStatementInput", "statement"));

    document.querySelectorAll(".list-group-item").forEach(item => {
        item.addEventListener("mouseenter", () => item.style.backgroundColor = "#F0E68C");
        item.addEventListener("mouseleave", () => item.style.backgroundColor = "");
    });

    const btnPremium = document.getElementById("btn-premium");
    if (btnPremium) {
        btnPremium.addEventListener("click", async function () {
            const userId = this.getAttribute("data-user-id");
            try {
                const response = await fetch(`/api/users/premium/${userId}`, { method: "GET", headers: { "Content-Type": "application/json" } });
                const result = await response.json();
                if (response.ok) {
                    showToast("El rol del usuario ha sido actualizado exitosamente.", "success");
                    updateUserRole();
                } else {
                    showToast(`Error: ${result.message}`, "error");
                }
            } catch (error) {
                console.error("Error al actualizar el rol del usuario:", error);
                showToast("Error al actualizar el rol del usuario.", "error");
            }
        });
    }
});

socket.on("documentsUpdated", ({ userId, documents }) => {
    console.log("Documentos recibidos en el socket:", documents);
    updateDocumentStatus(documents);
});