const form = document.getElementById('registrationForm');
const modal = document.getElementById('successModal');

const config = {
    firstName: { reg: /^[A-Za-z\s'-]+$/, sanitize: /[^A-Za-z\s'-]/g },
    lastName:  { reg: /^[A-Za-z\s'-]+$/, sanitize: /[^A-Za-z\s'-]/g },
    city:      { reg: /^[A-Za-z\s'-]+$/, sanitize: /[^A-Za-z\s'-]/g },
    phone:     { reg: /^[\d\s\-\+\(\)]{10,15}$/, sanitize: /[^\d\s\-\+\(\)]/g },
    zipcode:   { reg: /^\d{3,10}$/, sanitize: /[^\d]/g },
    email:     { reg: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    username:  { validate: val => val.trim().length > 0 },
    password:  { reg: /.{8,}/ },
    address:   { validate: val => val.trim().length >= 10 },
    birthdate: { validate: val => val.trim().length > 0 },
    gender:    { validate: () => [...document.getElementsByName('gender')].some(r => r.checked) },
    confirmPassword: { validate: (val) => val === form.password.value && val !== '' },
    country:   { validate: val => val !== '' },
    terms:     { validate: () => form.terms.checked }
};

document.querySelectorAll('input, select, textarea').forEach(input => {
    const fieldName = input.name;
    const rule = config[fieldName];

    if (!rule) return;

    if (rule.sanitize) {
        input.addEventListener('input', e => {
            e.target.value = e.target.value.replace(rule.sanitize, '');
            validateField(e.target);
        });
    } else if (fieldName !== 'terms') {
        input.addEventListener('input', e => validateField(e.target));
    }

    if (input.type !== 'checkbox' && input.type !== 'radio') {
        input.addEventListener('blur', e => validateField(e.target));
    }
});

function validateField(input) {
    const name = input.name;
    const rule = config[name];
    const val = input.value.trim();
    let isValid = false;

    if (rule.reg) isValid = rule.reg.test(val);
    else if (rule.validate) isValid = rule.validate(val);

    toggleError(input, name, isValid);
    return isValid;
}

function toggleError(input, name, isValid, isSubmit = false) {
    const errSpan = document.getElementById(name + 'Error');
    
    input.classList.toggle('error', !isValid && (isSubmit || input.value !== '' || name === 'country'));
    input.classList.toggle('success', isValid);
    
    // Handle regular input fields with ids
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            const requiredSpan = label.querySelector('.required');
            if (requiredSpan) {
                requiredSpan.style.display = isValid ? 'none' : 'inline';
            }
        }
    }
    
    // Handle gender radio group - it doesn't have an id
    if (name === 'gender') {
        const radioGroup = document.querySelector('.radio-group');
        if (radioGroup) {
            const parentFormGroup = radioGroup.closest('.form-group');
            if (parentFormGroup) {
                const genderLabel = parentFormGroup.querySelector('label:first-child');
                if (genderLabel) {
                    const requiredSpan = genderLabel.querySelector('.required');
                    if (requiredSpan) {
                        const genderChecked = [...document.getElementsByName('gender')].some(r => r.checked);
                        requiredSpan.style.display = genderChecked ? 'none' : 'inline';
                    }
                }
            }
        }
    }
    
    if (errSpan) errSpan.classList.toggle('show', !isValid && (isSubmit || input.value !== '' || name === 'country' || name === 'terms'));
}

form.addEventListener('submit', e => {
    e.preventDefault();
    let isFormValid = true;

    Object.keys(config).forEach(key => {
        const input = form[key];
        const rule = config[key];
        const val = input.value.trim();
        let isValid = false;

        if (rule.reg) isValid = rule.reg.test(val);
        else if (rule.validate) isValid = rule.validate(val);

        toggleError(input, key, isValid, true);
        if (!isValid) isFormValid = false;
    });

    const genderValid = [...document.getElementsByName('gender')].some(r => r.checked);
    document.getElementById('genderError').classList.toggle('show', !genderValid);
    if (!genderValid) isFormValid = false;

    if (isFormValid) modal.classList.add('show');
    else {
        const firstErr = document.querySelector('.error, .error-message.show');
        if(firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

function closeModal() {
    modal.classList.remove('show');
    form.reset();
    document.querySelectorAll('.success, .error, .show').forEach(el => el.classList.remove('success', 'error', 'show'));
}

const countrySelect = document.getElementById('country');

async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await response.json();

        data.sort((a, b) => a.name.common.localeCompare(b.name.common));

        data.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name.common; 
            option.textContent = country.name.common;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        countrySelect.innerHTML += '<option value="Other">Other</option>'; 
    }
}
fetchCountries();
countrySelect.addEventListener('change', (e) => validateField(e.target));

// Add event listeners for gender radio buttons
document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const genderInput = document.querySelector('input[name="gender"]');
        validateField(genderInput);
    });
});
