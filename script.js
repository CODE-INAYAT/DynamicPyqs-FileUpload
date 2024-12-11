const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("dropzone-file");

let uploadQueue = [];
let currentFileIndex = 0;
let fileTypeOrder = ["ESE", "ISE1", "ISE2", "COMBINED"];

// Drag-and-drop event listeners
dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("border-blue-500");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-blue-500");
});

dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("border-blue-500");

    const files = event.dataTransfer.files;
    if (files.length) {
        handleFileInput(files); // Validate and process files
    }
});

// Handle file input validation and UI update
function handleFileInput(files) {
    const file = files[0];
    if (file && file.type === "application/pdf") {
        updateFileIcon(file); // Valid PDF file
    } else {
        alert("Only PDF files are allowed. Please upload a valid PDF.");
    }
}

// Update file icon and name
function updateFileIcon(file) {
    const fileContainer = document.getElementById("file-container");
    const fileIcon = document.getElementById("file-icon");
    const fileNameDisplay = document.getElementById("file-name-display");

    // Hide file container and show file icon
    fileContainer.style.display = "none";
    fileIcon.style.display = "flex"; // Change display to flex

    // Update file name
    fileNameDisplay.textContent = file.name;
}

function resetFileInput() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("dropzone-file");
    const fileContainer = document.getElementById("file-container");
    const fileIcon = document.getElementById("file-icon");
    const fileNameDisplay = document.getElementById("file-name-display");

    // 1. Clear the file input value
    fileInput.value = "";

    // 2. Reset the visual state of the dropzone
    dropzone.classList.remove("border-blue-500");

    // 3. Reset the file icon and name display
    fileContainer.style.display = "flex";
    fileIcon.style.display = "none";
    fileNameDisplay.textContent = "";
}

//// File traversal and upload logic ////

document.addEventListener("DOMContentLoaded", () => {
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");

    const step1Submit = document.getElementById("step1Submit");
    const step2Submit = document.getElementById("step2Submit");
    const backToStep1 = document.getElementById("backToStep1");
    const backToStep2 = document.getElementById("backToStep2");
    const finalSubmit = document.getElementById("finalSubmit");

    // Step 1 -> Step 2 Validation
    step1Submit.addEventListener("click", () => {
        const name = document.getElementById("name").value;
        const branch = document.getElementById("branch").value;

        if (name === "" || name === "xyz" || name === "abc") {
            alert("Please Enter Your Name");
            return;
        }

        if (branch === "Select Which Branch Of Pyqs Uploading") {
            alert("Please select branch");
            return;
        }

        disableInputs(step1);
        step2.classList.remove("hidden");
        scrollToElement(step2);
    });

    // Step 2 -> Step 3 Validation
    step2Submit.addEventListener("click", () => {
        const SEM = document.getElementById("SEM").value;

        const newUploadRadio = document.getElementById("newUpload");
        const updateExistingRadio = document.getElementById("updateExisting");
        const isRadioSelected = newUploadRadio.checked || updateExistingRadio.checked;

        const checkboxes = [
            document.getElementById("ESE"),
            document.getElementById("ISE1"),
            document.getElementById("ISE2"),
            document.getElementById("COMBINED")
        ];
        const checkedCount = checkboxes.filter(checkbox => checkbox.checked).length;

        if (SEM === "Select Which SEM PYQS Uploading") {
            alert("Please select SEM");
            return;
        }

        if (checkedCount === 0) {
            alert("Please select at least one paper type.");
            return;
        }

        if (!isRadioSelected) {
            alert("Please select either New Upload or Update Existing");
            return;
        }

        if (checkedCount > 3) {
            alert("You can select a maximum of 3 options.");
            return; // Prevent moving to next step
        }

        uploadQueue = checkboxes
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);
        currentFileIndex = 0;

        disableInputs(step2);
        step3.classList.remove("hidden");
        updateFileUploadMessage();
        scrollToElement(step3);
    });

    // Step 3 -> Step 2 (Back)
    backToStep2.addEventListener("click", () => {
        step3.classList.add("hidden");
        enableInputs(step2);
        scrollToElement(step2);
    });

    // Step 2 -> Step 1 (Back)
    backToStep1.addEventListener("click", () => {
        step2.classList.add("hidden");
        enableInputs(step1);
        scrollToElement(step1);
    });

    // Handle final file upload
    finalSubmit.addEventListener("click", async () => {
        const dropzoneFile = fileInput.files[0];

        if (!dropzoneFile) {
            alert("Please upload a file.");
            scrollToElement(step3);
        }

        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const fileContent = fileReader.result.split(",")[1];
            const SEM = document.getElementById("SEM").value;
            const branch = document.getElementById("branch").value;
            const year = document.getElementById("year").value;
            const name = document.getElementById("name").value;
            const currentFileType = uploadQueue[currentFileIndex];

            const baseName = `${SEM}_${currentFileType}`;
            const renamedFileName = `${baseName} (${name})`;
            const isNewUpload = document.getElementById("newUpload").checked;

            const uploadData = {
                name: name,
                branch: branch,
                year: year,
                sem: SEM,
                fileName: dropzoneFile.name,
                fileContent: fileContent,
                mimeType: dropzoneFile.type,
                renamedFileName: renamedFileName,
                baseName: baseName,
                isNewUpload: isNewUpload
            };

            console.log("Checking file existence for:", baseName);

            try {
                const checkResponse = await fetch("https://script.google.com/macros/s/AKfycbw9ilc_U4N5lv1c1Xbd_yOYAAp40sqCfx4IKoUGmEZY1xlEr5b74YDxiz4yfq-cgp1e/exec/check", {
                    method: "POST",
                    body: JSON.stringify({ baseName: baseName })
                });

                const checkResult = await checkResponse.json();

                if (isNewUpload && checkResult.exists) {
                    alert("A file with the same base name already exists. Upload canceled.");
                    return;
                } else if (!isNewUpload && checkResult.exists) {
                    console.log("Replacing existing file:", renamedFileName);
                } else if (!isNewUpload && !checkResult.exists) {
                    console.log("No existing file found. Uploading new file:", renamedFileName);
                }

                const response = await fetch("https://script.google.com/macros/s/AKfycbw9ilc_U4N5lv1c1Xbd_yOYAAp40sqCfx4IKoUGmEZY1xlEr5b74YDxiz4yfq-cgp1e/exec/upload", {
                    method: "POST",
                    body: JSON.stringify(uploadData)
                });

                const result = await response.json();
                if (result.success) {
                    alert("File uploaded successfully! Proceed to upload the next file.");
                    handleNextFileType();
                    resetFileInput();

                } else {
                    alert("Error: " + result.message);
                }
            } catch (error) {
                console.error("Upload failed:", error);
                alert("Failed to upload file. Please try again.");
            }
        };

        fileReader.readAsDataURL(dropzoneFile);
    });


    // finalSubmit.addEventListener("click", async () => {
    //     const dropzoneFile = fileInput.files[0];

    //     if (!dropzoneFile) {
    //         alert("Please upload a file.");
    //         scrollToElement(step3);
    //     }

    //     const fileReader = new FileReader();
    //     fileReader.onload = async () => {
    //         const SEM = document.getElementById("SEM").value;
    //         const branch = document.getElementById("branch").value;
    //         const year = document.getElementById("year").value;
    //         const name = document.getElementById("name").value;
    //         const currentFileType = uploadQueue[currentFileIndex];

    //         const uploadData = {
    //             name: name,
    //             branch: branch,
    //             year: year,
    //             sem: SEM,
    //             fileName: dropzoneFile.name,
    //             fileContent: fileReader.result.split(",")[1],
    //             mimeType: dropzoneFile.type,
    //             renamedFileName: `${SEM}_${currentFileType} (${name})`
    //         };

    //         console.log("Uploading file:", uploadData.renamedFileName);

    //         try {
    //             const response = await fetch("https://script.google.com/macros/s/AKfycbwIZp-LfyFcDH6eaUjUYh-4lHKvyqVSc12DFhn2-YNYw3vfRvZdJTydA3dMtDP_XRXv/exec", {
    //                 method: "POST",
    //                 body: JSON.stringify(uploadData)
    //             });

    //             const result = await response.json();
    //             if (result.success) {
    //                 alert("File uploaded successfully! Proceed to upload the next file.");
    //                 handleNextFileType();
    //                 resetFileInput();

    //             } else {
    //                 alert("Error: " + result.message);
    //             }
    //         } catch (error) {
    //             console.error("Upload failed:", error);
    //             alert("Failed to upload file. Please try again.");
    //         }
    //     };

    //     fileReader.readAsDataURL(dropzoneFile);
    // });

    // Update file upload message based on queue
    function updateFileUploadMessage() {
        const fileTypes = ["ESE", "ISE1", "ISE2", "COMBINED"];
        fileTypes.forEach((type) => {
            const element = document.getElementById(`${type.toLowerCase()}FileUpload`);
            element.style.display = type === uploadQueue[currentFileIndex] ? "block" : "none";
        });
    }

    // Manage file type upload sequence
    function handleNextFileType() {
        currentFileIndex++;

        if (currentFileIndex < uploadQueue.length) {
            updateFileUploadMessage();
        } else {
            alert("All files uploaded successfully!");
            resetForm();
        }
    }

    // Reset form for a new session
    function resetForm() {
        currentFileIndex = 0;
        uploadQueue = [];
        step1.classList.remove("hidden");
        step2.classList.add("hidden");
        step3.classList.add("hidden");
        enableInputs(step1);
        document.getElementById("file-container").style.display = "flex";
        document.getElementById("file-icon").style.display = "none";
    }

    // Disable inputs
    function disableInputs(section) {
        const inputs = section.querySelectorAll("input, select");
        inputs.forEach(input => input.disabled = true);
    }

    // Enable inputs
    function enableInputs(section) {
        const inputs = section.querySelectorAll("input, select");
        inputs.forEach(input => input.disabled = false);
    }

    // Scroll to element
    function scrollToElement(element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});
