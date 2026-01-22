let currentRecordId = null;

ZOHO.embeddedApp.on("PageLoad", (e) => { 
    if(e && e.EntityId){
        currentRecordId = e.EntityId[0]; 
    }
});

ZOHO.embeddedApp.init().then(() => {
    const modal = document.getElementById('modal-overlay');
    const form = document.getElementById('record-form');
    const alertMsg = document.getElementById('alert-message');
    const successMsg = document.getElementById('success-message');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalTitle = document.querySelector('.modal-header h3');

    document.getElementById('main-update-btn').onclick = async () => {
        const response = await ZOHO.CRM.API.getRecord({
            Entity: "Accounts", 
            RecordID: currentRecordId
        });
        
        const ctStatus = response.data[0].CT_Status;

        modal.classList.remove('hidden');
        successMsg.classList.add('hidden');
        cancelBtn.innerText = "Cancel";

        if (!ctStatus) {
            form.classList.remove('hidden');
            alertMsg.classList.add('hidden');
            saveBtn.classList.remove('hidden');
            modalTitle.innerText = "Corporate Tax Information";
        } else {
            form.classList.add('hidden');
            alertMsg.classList.remove('hidden');
            saveBtn.classList.add('hidden');
            modalTitle.innerText = "Notice";
        }
    };

    cancelBtn.onclick = () => {
        if (cancelBtn.getAttribute('data-action') === 'reload') {
            ZOHO.CRM.UI.Popup.closeReload();
        } else {
            modal.classList.add('hidden');
            form.reset();
        }
    };

    saveBtn.onclick = async () => {
        if (validateForm()) { 
            toggleLoading(true);

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
                console.log(execute_function);
                toggleLoading(false);
                
                form.classList.add('hidden');
                saveBtn.classList.add('hidden');
                successMsg.classList.remove('hidden');
                modalTitle.innerText = "Update Successful";
                cancelBtn.innerText = "Close";
                cancelBtn.setAttribute('data-action', 'reload');
                
            } catch (error) {
                toggleLoading(false);
                console.error("Function Error", error);
                alert("An error occurred while updating the account.");
            }
        }
    };
});

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
    const btnText = document.getElementById('btn-text');
    const loader = document.getElementById('loader');
    const saveBtn = document.getElementById('save-btn');
    
    if (isLoading) {
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        saveBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        saveBtn.disabled = false;
    }
}

ZOHO.embeddedApp.init();