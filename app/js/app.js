let currentRecordId = null;
const SELECTORS = {
  popup: "popup",
  popupTitle: "popupTitle",
  popupMessage: "popupMessage",
};

// 1. Listen for PageLoad to capture the Record ID
ZOHO.embeddedApp.on("PageLoad", async (e) => {
    if (e && e.EntityId) {
        currentRecordId = e.EntityId[0];
        
        // 2. Initialize the SDK
        ZOHO.embeddedApp.init().then(() => {
            checkTaxStatus();
        });
    }
});

function showPopup(message, type = "restricted") {
  const popup = document.getElementById(SELECTORS.popup);
  popup.classList.remove("hidden");
  popup.classList.toggle("success", type === "success");
  popup.classList.toggle("restricted", type !== "success");
  document.getElementById(SELECTORS.popupTitle).textContent = "Action Status";
  document.getElementById(SELECTORS.popupMessage).innerHTML = message;
}

function hidePopup() {
    const popup = document.getElementById("popup");
    popup.classList.add("hidden");
    popup.classList.remove("success", "restricted");
    ZOHO.CRM.UI.Popup.closeReload().then(console.log)
}


// 3. Check if the field already has a value
async function checkTaxStatus() {
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('record-form');
    const saveBtn = document.getElementById('save-btn');
    const modalTitle = document.querySelector('.modal-header h3');

    try {
        toggleLoading(true, "Loading...");

        const response = await ZOHO.CRM.API.getRecord({
            Entity: "Accounts",
            RecordID: currentRecordId
        });

        const record = response.data[0];
        const ctStatus = record.CT_Status;

        modal.classList.remove('hidden');

        if (!ctStatus) {
            toggleLoading(false);
            form.classList.remove('hidden');
            saveBtn.classList.remove('hidden');
            modalTitle.innerText = "Corporate Tax Information";
        } else {
            toggleLoading(false); 
            showPopup("Corporate Tax information can no longer be updated because a value already exists.", "restricted");
        }
    } catch (error) {
        toggleLoading(false);
        console.error("Error:", error);
    }
}

// 4. Handle Save Operation
document.getElementById('save-btn').onclick = async () => {
    if (validateForm()) {
        toggleLoading(true, "Processing...");

        const function_name = "dev_corporate_tax_ct_setup";
        const formData = {
            "arguments": JSON.stringify({
                "account_id": currentRecordId,
                "ct_status": document.getElementById('ct-status').value,
                "trn": document.getElementById('corporate-tax-trn').value,
                "period": document.getElementById('tax-period-ct').value,
                "return_date": document.getElementById('ct-return-dd').value
            })
        };

        try {
            const execute_function = await ZOHO.CRM.FUNCTIONS.execute(function_name, formData);
            console.log("Success:", execute_function);
            
            toggleLoading(false);

            showPopup("Corporate Tax Information updated sucessfully.", "success");
            
        } catch (error) {
            toggleLoading(false);
            console.error("Function Error", error);
            alert("An error occurred while updating the account.");
        }
    }
};

// 5. Handle Close/Cancel
document.getElementById('cancel-btn').onclick = () => {
    const btn = document.getElementById('cancel-btn');
    if (btn.getAttribute('data-action') === 'reload') {
        ZOHO.CRM.UI.Popup.closeReload();
    } else {
        ZOHO.CRM.UI.Popup.close();
    }
};

// 6. Helper Functions
function validateForm() {
    let isValid = true;
    const fields = ['ct-status', 'corporate-tax-trn', 'tax-period-ct', 'ct-return-dd'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        const err = document.getElementById(`error-${id}`);
        if (!el.value) {
            err.innerText = "This field is required";
            isValid = false;
        } else {
            err.innerText = "";
        }
    });
    return isValid;
}

function toggleLoading(isLoading) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const saveBtn = document.getElementById('save-btn');
    
    if (isLoading) {
        loadingOverlay.classList.remove('hidden');
        saveBtn.disabled = true;
    } else {
        loadingOverlay.classList.add('hidden');
        saveBtn.disabled = false;
    }
}

ZOHO.embeddedApp.init();