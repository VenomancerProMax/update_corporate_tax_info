let currentRecordId = null;
let userProfile = null;
const SELECTORS = {
  popup: "popup",
  popupTitle: "popupTitle",
  popupMessage: "popupMessage",
};

ZOHO.embeddedApp.on("PageLoad", async (e) => {
    if (e && e.EntityId) {
        currentRecordId = e.EntityId[0];
        
        try {
            const userData = await ZOHO.CRM.CONFIG.getCurrentUser();
            userProfile = userData.users[0].profile.name; 
            
            checkTaxStatus();
        } catch (error) {
            console.error("Initialization Error:", error);
        }
    }
});

ZOHO.embeddedApp.init();

async function checkTaxStatus() {
    if(!currentRecordId) return;

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

        if (response.data && response.data.length > 0) {
            const record = response.data[0];
            modal.classList.remove('hidden');

            const isAuthorized = (userProfile === "TA-Accountants" || userProfile === "TA-General Manager");

            if (isAuthorized) {
                if (record.CT_Status) document.getElementById('ct-status').value = record.CT_Status;
                if (record.Corporate_Tax_TRN) document.getElementById('corporate-tax-trn').value = record.Corporate_Tax_TRN;
                if (record.Tax_Period_CT) document.getElementById('tax-period-ct').value = record.Tax_Period_CT;
                if (record.CT_Return_DD) document.getElementById('ct-return-dd').value = record.CT_Return_DD;

                toggleLoading(false);
                form.classList.remove('hidden');
                saveBtn.classList.remove('hidden');
                modalTitle.innerText = "Corporate Tax Information";
            } else {
                toggleLoading(false); 
                showPopup("Corporate Tax information can no longer be updated as a value already exists.", "restricted");
            }
        }
    } catch (error) {
        toggleLoading(false);
        console.error("Fetch Error:", error);
    }
}

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
    ZOHO.CRM.UI.Popup.closeReload();
}

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
            await ZOHO.CRM.FUNCTIONS.execute(function_name, formData);
            toggleLoading(false);
            showPopup("Corporate Tax Information updated sucessfully.", "success");
        } catch (error) {
            toggleLoading(false);
            console.error("Function Error", error);
        }
    }
};

document.getElementById('cancel-btn').onclick = () => {
    ZOHO.CRM.UI.Popup.close();
};

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