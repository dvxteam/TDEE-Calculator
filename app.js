document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Theme toggling logic
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check local storage or set default dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const activeTheme = htmlElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    }

    // Gender radio selection highlighting
    const genderLabels = document.querySelectorAll('.gender-label');
    genderLabels.forEach(label => {
        label.addEventListener('click', () => {
            genderLabels.forEach(l => l.classList.remove('active'));
            label.classList.add('active');
        });
    });

    // Form inputs and calculation elements
    const form = document.getElementById('tdee-form');
    const resultsSection = document.getElementById('results-section');
    const calorieOffsetRange = document.getElementById('calorie-offset-range');
    const offsetDisplay = document.getElementById('offset-display');
    const resetOffsetBtn = document.getElementById('reset-offset');
    const macroTargetCals = document.getElementById('macro-target-calories');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Values to store computed baseline results
    let computedBmr = 0;
    let computedTdee = 0;
    let currentGoal = 'maintenance'; // maintenance, cutting, bulking
    let currentCalorieOffset = 0;

    // Handle form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndDisplay();
    });

    // Handle range adjustment for calories
    calorieOffsetRange.addEventListener('input', (e) => {
        currentCalorieOffset = parseInt(e.target.value);
        offsetDisplay.textContent = (currentCalorieOffset >= 0 ? '+' : '') + currentCalorieOffset + ' kcal';
        updateMacros();
    });

    resetOffsetBtn.addEventListener('click', () => {
        calorieOffsetRange.value = 0;
        currentCalorieOffset = 0;
        offsetDisplay.textContent = '+0 kcal';
        updateMacros();
    });

    // Handle Tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGoal = btn.getAttribute('data-goal');
            updateMacros();
        });
    });

    // Print & Share
    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btn-share').addEventListener('click', () => {
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = document.getElementById('age').value;
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const bf = document.getElementById('bodyfat').value;
        const activity = document.getElementById('activity').value;

        let query = `?gender=${gender}&age=${age}&weight=${weight}&height=${height}&activity=${activity}`;
        if (bf) query += `&bf=${bf}`;

        const shareUrl = window.location.origin + window.location.pathname + query;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('คัดลอกลิงก์ผลลัพธ์ลงใน Clipboard แล้ว! คุณสามารถส่งต่อให้ลูกเทรนได้ทันที');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('ไม่สามารถคัดลอกอัตโนมัติได้ ลิงก์ของคุณคือ: ' + shareUrl);
        });
    });

    // Parse URL params for pre-filling
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('gender') && urlParams.has('age') && urlParams.has('weight') && urlParams.has('height')) {
            const genderVal = urlParams.get('gender');
            const ageVal = urlParams.get('age');
            const weightVal = urlParams.get('weight');
            const heightVal = urlParams.get('height');
            const bfVal = urlParams.get('bf') || urlParams.get('bodyfat');
            const actVal = urlParams.get('activity') || urlParams.get('act');

            // Select gender radio
            const genderInput = document.querySelector(`input[name="gender"][value="${genderVal}"]`);
            if (genderInput) {
                genderInput.checked = true;
                genderLabels.forEach(l => l.classList.remove('active'));
                genderInput.closest('.gender-label').classList.add('active');
            }

            // Fill text fields
            if (ageVal) document.getElementById('age').value = ageVal;
            if (weightVal) document.getElementById('weight').value = weightVal;
            if (heightVal) document.getElementById('height').value = heightVal;
            if (bfVal !== null && bfVal !== undefined && bfVal !== '') {
                document.getElementById('bodyfat').value = bfVal;
            } else {
                document.getElementById('bodyfat').value = '';
            }
            if (actVal) document.getElementById('activity').value = actVal;

            calculateAndDisplay();
        }
    }

    // Perform Calculations
    function calculateAndDisplay() {
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = parseFloat(document.getElementById('age').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const bf = document.getElementById('bodyfat').value ? parseFloat(document.getElementById('bodyfat').value) : null;
        const actFactor = parseFloat(document.getElementById('activity').value);

        // 1. Calculate BMR
        const bmrBadge = document.getElementById('bmr-formula-badge');
        if (bf !== null && bf > 0) {
            // Katch-McArdle Formula
            const lbm = weight * (1 - (bf / 100));
            computedBmr = 370 + (21.6 * lbm);
            bmrBadge.textContent = 'Katch-McArdle (อิงเปอร์เซ็นต์ไขมัน)';
        } else {
            // Mifflin-St Jeor Formula
            if (gender === 'male') {
                computedBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                computedBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }
            bmrBadge.textContent = 'Mifflin-St Jeor (มาตรฐาน)';
        }

        // 2. Calculate TDEE
        computedTdee = computedBmr * actFactor;

        // Render standard outputs
        document.getElementById('res-tdee').textContent = Math.round(computedTdee).toLocaleString('th-TH');
        document.getElementById('res-tdee-weekly').textContent = Math.round(computedTdee * 7).toLocaleString('th-TH');
        document.getElementById('res-bmr').textContent = Math.round(computedBmr).toLocaleString('th-TH');

        // 3. Render Activity Breakdown Table
        const factors = {
            '1.2': document.getElementById('act-val-12'),
            '1.375': document.getElementById('act-val-1375'),
            '1.55': document.getElementById('act-val-155'),
            '1.725': document.getElementById('act-val-1725'),
            '1.9': document.getElementById('act-val-19')
        };

        const rows = {
            '1.2': document.getElementById('act-row-12'),
            '1.375': document.getElementById('act-row-1375'),
            '1.55': document.getElementById('act-row-155'),
            '1.725': document.getElementById('act-row-1725'),
            '1.9': document.getElementById('act-row-19')
        };

        // Reset row styles
        Object.values(rows).forEach(r => r.classList.remove('success-row'));

        // Highlight selected row & set values
        Object.entries(factors).forEach(([fStr, element]) => {
            const factorVal = parseFloat(fStr);
            const val = Math.round(computedBmr * factorVal);
            element.textContent = val.toLocaleString('th-TH') + ' kcal';
            
            if (Math.abs(factorVal - actFactor) < 0.01) {
                rows[fStr].classList.add('success-row');
            }
        });

        // 4. Calculate Ideal Weight Range
        const heightInInches = height / 2.54;
        const inchesOver5Ft = Math.max(0, heightInInches - 60);
        let hamwi = 0, devine = 0, robinson = 0, miller = 0;

        if (gender === 'male') {
            hamwi = 48.0 + (2.7 * inchesOver5Ft);
            devine = 50.0 + (2.3 * inchesOver5Ft);
            robinson = 52.0 + (1.9 * inchesOver5Ft);
            miller = 56.2 + (1.41 * inchesOver5Ft);
        } else {
            hamwi = 45.5 + (2.2 * inchesOver5Ft);
            devine = 45.5 + (2.3 * inchesOver5Ft);
            robinson = 49.0 + (1.7 * inchesOver5Ft);
            miller = 53.1 + (1.36 * inchesOver5Ft);
        }

        // Render ideal weight list
        document.getElementById('ideal-hamwi').textContent = Math.round(hamwi) + ' kg';
        document.getElementById('ideal-devine').textContent = Math.round(devine) + ' kg';
        document.getElementById('ideal-robinson').textContent = Math.round(robinson) + ' kg';
        document.getElementById('ideal-miller').textContent = Math.round(miller) + ' kg';

        const weights = [hamwi, devine, robinson, miller];
        const minIdeal = Math.round(Math.min(...weights));
        const maxIdeal = Math.round(Math.max(...weights));
        document.getElementById('res-ideal-range').textContent = `${minIdeal} - ${maxIdeal} กก.`;

        // 5. BMI calculation
        const bmi = weight / ((height / 100) ** 2);
        document.querySelectorAll('#res-bmi').forEach(el => {
            el.textContent = bmi.toFixed(1);
        });

        // BMI Status & Pointer Pos
        const bmiStatus = document.getElementById('res-bmi-status');
        const bmiPointer = document.getElementById('bmi-pointer');
        let pointerPercent = 0;

        if (bmi < 18.5) {
            bmiStatus.textContent = 'น้ำหนักน้อย / Underweight';
            bmiStatus.className = 'badge badge-secondary';
            // Scale 10 to 18.5 mapped to 0% to 25%
            pointerPercent = Math.max(0, Math.min(25, ((bmi - 10) / 8.5) * 25));
        } else if (bmi >= 18.5 && bmi < 25.0) {
            bmiStatus.textContent = 'น้ำหนักปกติ / Normal Weight';
            bmiStatus.className = 'badge badge-primary';
            // Scale 18.5 to 25 mapped to 25% to 55%
            pointerPercent = 25 + (((bmi - 18.5) / 6.5) * 30);
        } else if (bmi >= 25.0 && bmi < 30.0) {
            bmiStatus.textContent = 'น้ำหนักเกิน / Overweight';
            bmiStatus.className = 'badge';
            bmiStatus.style.backgroundColor = 'var(--warning)';
            bmiStatus.style.color = '#fff';
            // Scale 25 to 30 mapped to 55% to 80%
            pointerPercent = 55 + (((bmi - 25) / 5.0) * 25);
        } else {
            bmiStatus.textContent = 'โรคอ้วน / Obese';
            bmiStatus.className = 'badge';
            bmiStatus.style.backgroundColor = 'var(--danger)';
            bmiStatus.style.color = '#fff';
            // Scale 30 to 40 mapped to 80% to 100%
            pointerPercent = 80 + Math.min(20, (((bmi - 30) / 10.0) * 20));
        }
        
        bmiPointer.style.left = `${pointerPercent}%`;

        // 6. Martin Berkhan's Maximum Muscular Potential
        const maxMusc5 = height - 100;
        const maxMuscLbm = maxMusc5 * 0.95;
        const maxMusc10 = maxMuscLbm / 0.90;
        const maxMusc15 = maxMuscLbm / 0.85;

        document.getElementById('musc-5').textContent = Math.round(maxMusc5) + ' กก.';
        document.getElementById('musc-10').textContent = Math.round(maxMusc10) + ' กก.';
        document.getElementById('musc-15').textContent = Math.round(maxMusc15) + ' กก.';

        // 7. Update Dynamic Supplements
        updateSupplements(gender);

        // 8. Update Macros based on selected Goal
        updateMacros();

        // Reveal results section with a nice smooth fade in
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function updateSupplements(gender) {
        const container = document.getElementById('supplements-content');
        if (!container) return;

        let contentHtml = '';
        if (gender === 'male') {
            contentHtml = `
                <div class="supplements-grid">
                    <div class="supplement-card">
                        <div class="supplement-header">
                            <i data-lucide="shield-check" class="text-primary"></i>
                            <h4>น้ำมันปลา Omega-3 / Fish Oil</h4>
                        </div>
                        <p>ช่วยปรับสมดุลสัดส่วนไขมันดี ลดระดับการอักเสบภายในร่างกาย และบำรุงระบบหัวใจและหลอดเลือด เหมาะอย่างยิ่งสำหรับผู้ที่ต้องการดูแลสุขภาพในภาพรวมและออกกำลังกายเป็นประจำ</p>
                    </div>
                    <div class="supplement-card">
                        <div class="supplement-header">
                            <i data-lucide="sun" class="text-warning"></i>
                            <h4>วิตามินดี 3 / Vitamin D3</h4>
                        </div>
                        <p>สำคัญมากสำหรับระบบภูมิคุ้มกัน การดูดซึมแคลเซียม และการรักษาระดับฮอร์โมนเพศชาย (Testosterone) ให้อยู่ในระดับที่เหมาะสมสำหรับการสร้างมวลกล้ามเนื้อและควบคุมไขมัน</p>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="supplements-grid">
                    <div class="supplement-card">
                        <div class="supplement-header">
                            <i data-lucide="sparkles" class="text-primary"></i>
                            <h4>แคลเซียม & วิตามินดี 3 / Calcium & D3</h4>
                        </div>
                        <p>ช่วยบำรุงรักษามวลกระดูกและความแข็งแรงของข้อต่อ ซึ่งสำคัญอย่างยิ่งสำหรับผู้หญิงเพื่อป้องกันการสูญเสียมวลกระดูกและการบาดเจ็บจากการออกกำลังกายแรงกระแทกสูง</p>
                    </div>
                    <div class="supplement-card">
                        <div class="supplement-header">
                            <i data-lucide="zap" class="text-danger"></i>
                            <h4>ธาตุเหล็ก / Iron</h4>
                        </div>
                        <p>ช่วยบำรุงโลหิตและเพิ่มการขนส่งออกซิเจนไปยังเซลล์ต่างๆ ทั่วร่างกาย ป้องกันภาวะโลหิตจางและอาการเหนื่อยง่ายในชีวิตประจำวันและการเทรนนิ่ง</p>
                    </div>
                </div>
            `;
        }

        container.innerHTML = contentHtml;
        lucide.createIcons();
    }

    function updateMacros() {
        let baseCalories = computedTdee;
        
        if (currentGoal === 'cutting') {
            baseCalories = computedTdee - 500;
        } else if (currentGoal === 'bulking') {
            baseCalories = computedTdee + 500;
        }

        const targetCalories = Math.max(1000, Math.round(baseCalories + currentCalorieOffset));
        macroTargetCals.textContent = targetCalories.toLocaleString('th-TH');

        // Macronutrients Splits: Moderate (30/35/35), Lower (40/40/20), Higher (30/20/50)
        // Helper to calculate and set text content
        const calculateGrams = (pRatio, fRatio, cRatio, prefix) => {
            const pCals = targetCalories * pRatio;
            const fCals = targetCalories * fRatio;
            const cCals = targetCalories * cRatio;

            const pGrams = Math.round(pCals / 4);
            const fGrams = Math.round(fCals / 9);
            const cGrams = Math.round(cCals / 4);

            document.getElementById(`${prefix}-p-g`).textContent = `${pGrams}g`;
            document.getElementById(`${prefix}-p-c`).textContent = `${Math.round(pCals)} kcal`;

            document.getElementById(`${prefix}-f-g`).textContent = `${fGrams}g`;
            document.getElementById(`${prefix}-f-c`).textContent = `${Math.round(fCals)} kcal`;

            document.getElementById(`${prefix}-c-g`).textContent = `${cGrams}g`;
            document.getElementById(`${prefix}-c-c`).textContent = `${Math.round(cCals)} kcal`;
        };

        calculateGrams(0.30, 0.35, 0.35, 'mod');
        calculateGrams(0.40, 0.40, 0.20, 'low');
        calculateGrams(0.30, 0.20, 0.50, 'high');
    }

    // --- Trainee History Logic ---
    const btnSaveHistory = document.getElementById('btn-save-history');
    const traineeNameInput = document.getElementById('trainee-name');
    const historyEmpty = document.getElementById('history-empty');
    const historyList = document.getElementById('history-list');

    // Load and render history from LocalStorage
    function loadHistory() {
        const historyData = localStorage.getItem('traineeHistory');
        const history = historyData ? JSON.parse(historyData) : [];

        if (history.length === 0) {
            historyEmpty.style.display = 'flex';
            historyList.style.display = 'none';
            return;
        }

        historyEmpty.style.display = 'none';
        historyList.style.display = 'flex';
        historyList.innerHTML = '';

        history.forEach((trainee, index) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            // Build text stats
            const bfText = trainee.bf ? `, BF: ${trainee.bf}%` : '';
            const statsSummary = `${trainee.gender === 'male' ? 'ชาย' : 'หญิง'}, ${trainee.age} ปี, ${trainee.weight} กก., ${trainee.height} ซม.${bfText}`;

            li.innerHTML = `
                <div class="history-item-info">
                    <span class="history-item-name">${trainee.name}</span>
                    <span class="history-item-stats">${statsSummary}</span>
                </div>
                <button type="button" class="btn-delete-history" data-index="${index}" title="ลบประวัติ">
                    <i data-lucide="trash-2"></i>
                </button>
            `;

            // Click item to load stats
            li.addEventListener('click', (e) => {
                // If clicked delete button, skip loading
                if (e.target.closest('.btn-delete-history')) return;
                
                loadTraineeData(trainee);
            });

            historyList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                deleteTrainee(index);
            });
        });

        lucide.createIcons();
    }

    // Save current form inputs to history
    function saveTrainee() {
        const name = traineeNameInput.value.trim();
        if (!name) {
            alert('กรุณากรอกชื่อลูกเทรนก่อนบันทึกครับ');
            traineeNameInput.focus();
            return;
        }

        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = parseFloat(document.getElementById('age').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const bf = document.getElementById('bodyfat').value ? parseFloat(document.getElementById('bodyfat').value) : null;
        const activity = document.getElementById('activity').value;

        const traineeRecord = {
            name,
            gender,
            age,
            weight,
            height,
            bf,
            activity,
            date: new Date().toLocaleDateString('th-TH')
        };

        const historyData = localStorage.getItem('traineeHistory');
        const history = historyData ? JSON.parse(historyData) : [];
        
        // Append new record
        history.unshift(traineeRecord);
        localStorage.setItem('traineeHistory', JSON.stringify(history));
        
        traineeNameInput.value = ''; // Reset name input
        loadHistory();
        alert(`บันทึกข้อมูลของ ${name} เรียบร้อยแล้ว!`);
    }

    // Delete trainee record
    function deleteTrainee(index) {
        if (!confirm('คุณต้องการลบประวัติของลูกเทรนคนนี้ใช่หรือไม่?')) return;

        const historyData = localStorage.getItem('traineeHistory');
        if (historyData) {
            const history = JSON.parse(historyData);
            history.splice(index, 1);
            localStorage.setItem('traineeHistory', JSON.stringify(history));
            loadHistory();
        }
    }

    // Load trainee record back to inputs and calculate
    function loadTraineeData(trainee) {
        const genderInput = document.querySelector(`input[name="gender"][value="${trainee.gender}"]`);
        if (genderInput) {
            genderInput.checked = true;
            genderLabels.forEach(l => l.classList.remove('active'));
            genderInput.closest('.gender-label').classList.add('active');
        }

        document.getElementById('age').value = trainee.age;
        document.getElementById('weight').value = trainee.weight;
        document.getElementById('height').value = trainee.height;
        document.getElementById('bodyfat').value = trainee.bf || '';
        document.getElementById('activity').value = trainee.activity;

        // Reset name in save panel
        traineeNameInput.value = trainee.name;

        // Perform calculation
        calculateAndDisplay();
    }

    // Event listener for Save button
    btnSaveHistory.addEventListener('click', saveTrainee);

    // Call onload checks and render history list
    checkUrlParams();
    loadHistory();
});
