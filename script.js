document.addEventListener('DOMContentLoaded', async () => { // Thêm async

    // --- FORMSPREE ENDPOINT ID ---
    const FORMSPREE_ENDPOINT = 'xovpkqko';
    // --------------------------

    // --- IMAGE URLS (FIXED) ---
    const resultImages = {
        ongrid: {
            day: 'https://i.imgur.com/UasVTPC.gif',
            night: 'https://i.imgur.com/KU5UvKy.gif'
        },
        hybrid: {
            50: { // Corresponds to Option 1
                day: 'https://i.imgur.com/b1KbwmS.gif',
                night: 'https://i.imgur.com/og2oAns.gif'
            },
            70: { // Corresponds to Option 2
                day: 'https://i.imgur.com/JQuTBa1.gif',
                night: 'https://i.imgur.com/acBHhXc.gif'
            },
            90: { // Corresponds to Option 3
                day: 'https://i.imgur.com/1L5cVim.gif',
                night: 'https://i.imgur.com/zDqk1So.gif'
            }
        }
    };
    
    // --- STATE & CONFIGURATION ---
    let currentTranslations = {}; // Sẽ được tải từ file JSON
    let calculationState = {};
    let selectedResult = null; // To store the selected result card element
    const formatter = new Intl.NumberFormat('vi-VN');
    const MIN_BILL = 2000000; // Minimum bill amount
    const PANEL_AREA_SQM = 2.3; // Updated panel area
    
    // --- DOM ELEMENTS ---
    const ui = {
        form: document.getElementById('solar-form'),
        resultsSection: document.getElementById('results-section'),
        billInput: document.getElementById('bill'),
        dayUsageSlider: document.getElementById('day-usage-slider'), // Changed
        dayUsageValue: document.getElementById('day-usage-value'),   // Added
        regionSelect: document.getElementById('region-select'), // Changed
        roofChoiceOptions: document.getElementById('roof-choice-options'), // Added
        roofAreaInputWrapper: document.getElementById('roof-area-input-wrapper'), // Added
        roofAreaInput: document.getElementById('roof-area-input'), // Added
        panelPowerInput: document.getElementById('panel-power'),
        priceTypeOptions: document.getElementById('price-type-options'),
        hiddenPriceType: document.getElementById('price-type'),
        errorMessage: document.getElementById('error-message'),
        maxPacksDisplay: document.getElementById('max-packs-display'), // Added
        panelPackInfo: document.getElementById('panel-pack-info'), // Added ID for the container
        langSwitcher: {
            container: document.getElementById('language-switcher-container'),
            button: document.getElementById('language-switcher-button'),
            menu: document.getElementById('language-switcher-menu'),
            text: document.getElementById('selected-lang-text'),
            img: document.getElementById('language-switcher-button').querySelector('img')
        },
        resultToggle: {
            slider: document.getElementById('result-toggle-slider'),
            optionOngrid: document.getElementById('toggle-option-ongrid'),
            optionHybrid: document.getElementById('toggle-option-hybrid'),
            toggle: document.getElementById('result-toggle')
        },
        results: {
            ongrid: document.getElementById('ongrid-results'),
            hybrid: document.getElementById('hybrid-results'),
            hybridSingle: document.getElementById('hybrid-result-single'),
            hybridGrid: document.getElementById('hybrid-result-grid'),
            ongridRoofAreaWrapper: document.getElementById('ongrid-roof-area-wrapper'), // Added
            hybridSingleRoofAreaWrapper: document.getElementById('hybrid-single-roof-area-wrapper'), // Added
            hybridRoofAreaWrappers: { // Added
                50: document.getElementById('hybrid-roof-area-50-wrapper'),
                70: document.getElementById('hybrid-roof-area-70-wrapper'),
                90: document.getElementById('hybrid-roof-area-90-wrapper')
            }
        },
        // Image elements
        ongridResultImage: document.getElementById('ongrid-result-image'),
        hybridSingleImage: document.getElementById('hybrid-single-image'),
        hybridImage50: document.getElementById('hybrid-image-50'),
        hybridImage70: document.getElementById('hybrid-image-70'),
        hybridImage90: document.getElementById('hybrid-image-90'),

        confirmButtonContainer: document.getElementById('confirm-button-container'),
        confirmButton: document.getElementById('confirm-button'),
        toast: document.getElementById('toast-notification'), // Added toast
        popup: {
            overlay: document.getElementById('contact-popup'),
            content: document.querySelector('.popup-content'),
            closeButton: document.getElementById('close-popup'),
            form: document.getElementById('contact-form'),
            nameInput: document.getElementById('popup-name'), // Added
            phoneInput: document.getElementById('popup-phone'),
            phoneError: document.getElementById('phone-error'),
            submitButton: document.getElementById('submit-popup'),
            selectedSystemInput: document.getElementById('selected-system-info'),
            popupErrorMessage: document.getElementById('popup-error-message'), // Added
            // New Image Popup elements
            imageOverlay: document.getElementById('image-popup-overlay'),
            imageContent: document.getElementById('popup-image'),
            closeImageButton: document.getElementById('close-image-popup')
        }
    };
    
    // --- FUNCTIONS ---

    /**
     * Adjusts panel count to be divisible by 2 or 3. ONLY FOR ONGRID.
     * @param {number} panels - The initial calculated number of panels.
     * @returns {number} - The adjusted number of panels.
     */
    const adjustPanelCountOngrid = (panels) => {
        if (panels <= 0) return 0;
        if (panels % 2 === 0 || panels % 3 === 0) {
            return panels; // Already valid
        }
        return panels + 1; // Not valid, add 1
    };

    /**
     * (ĐÃ CẬP NHẬT) Tải file JSON ngôn ngữ và cập nhật UI.
     * @param {string} lang - The language to switch to ('vi' or 'en').
     */
    const switchLanguage = async (lang) => {
        try {
            const response = await fetch(`${lang}.json`); // Tải file (vi.json hoặc en.json)
            if (!response.ok) throw new Error(`Không thể tải ${lang}.json`);
            
            currentTranslations = await response.json(); // Lưu vào biến trạng thái

            document.documentElement.lang = lang;
            
            // Cập nhật text dựa trên 'currentTranslations'
            document.querySelectorAll('[data-translate]').forEach(el => {
                const key = el.getAttribute('data-translate');
                if (currentTranslations[key]) el.textContent = currentTranslations[key];
            });

            document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
                const key = el.getAttribute('data-translate-placeholder');
                if (currentTranslations[key]) el.placeholder = currentTranslations[key];
            });
            
            ui.langSwitcher.text.textContent = lang === 'vi' ? 'VN' : 'EN';
            ui.langSwitcher.img.src = lang === 'vi' ? 'https://imgur.com/6jPr7xK.png' : 'https://imgur.com/uC9LHVh.png';
            ui.langSwitcher.menu.classList.add('hidden');

        } catch (error) {
            console.error("Lỗi khi chuyển ngôn ngữ:", error);
        }
    };
    
     /**
     * (Đã cập nhật) Validates form inputs and returns a boolean and error message.
     * @returns {{isValid: boolean, errorKey: string|null}}
     */
    const validateInputs = () => {
        const bill = parseFloat(ui.billInput.value.replace(/\./g, ''));
        const dayUsage = parseFloat(ui.dayUsageSlider.value); // Read from slider
        const panelPower = parseFloat(ui.panelPowerInput.value);
        const region = ui.regionSelect.value; // Updated to regionSelect
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes';

        if (isNaN(bill) || bill < MIN_BILL) return { isValid: false, errorKey: 'error_bill_too_low' }; // Check minimum bill
        if (!region) return { isValid: false, errorKey: 'error_region_invalid' }; // Updated region check
        
        if (knowsRoof) { // Added validation for roof area
            const roofArea = parseFloat(ui.roofAreaInput.value);
            if (isNaN(roofArea) || roofArea <= 0) return { isValid: false, errorKey: 'error_roof_area_invalid' };
        }

        if (isNaN(panelPower) || panelPower <= 0) return { isValid: false, errorKey: 'error_invalid_panel' };
        
        return { isValid: true, errorKey: null };
    };

    /**
     * Switches the result view between 'ongrid' and 'hybrid'.
     * @param {string} type - 'ongrid' or 'hybrid'.
     */
    const switchResultView = (type) => {
        const { slider, optionOngrid, optionHybrid } = ui.resultToggle;
        if (type === 'ongrid') {
            slider.classList.remove('slide-right');
            optionOngrid.classList.add('selected');
            optionHybrid.classList.remove('selected');
            ui.results.ongrid.classList.remove('hidden');
            ui.results.hybrid.classList.add('hidden');
        } else {
            slider.classList.add('slide-right');
            optionOngrid.classList.remove('selected');
            optionHybrid.classList.add('selected');
            ui.results.ongrid.classList.add('hidden');
            ui.results.hybrid.classList.remove('hidden');
        }
        clearResultSelection();
    };

     /**
     * Clears the selected state from all result cards and hides the confirm button.
     */
     const clearResultSelection = () => {
        document.querySelectorAll('.result-card').forEach(card => card.classList.remove('result-selected'));
        selectedResult = null;
        ui.confirmButtonContainer.classList.add('hidden');
    };

    /**
     * Handles the selection of a result card. Allows toggling selection.
     * @param {Event} event - The click event.
     */
    const handleResultSelection = (event) => {
        const clickedCard = event.currentTarget; // The card that was clicked

        // Check if the clicked card is already selected
        if (clickedCard === selectedResult) {
            // If yes, unselect it
            clearResultSelection();
        } else {
            // If no, clear previous selection
            document.querySelectorAll('.result-card').forEach(card => card.classList.remove('result-selected'));

            // Highlight the clicked card
            clickedCard.classList.add('result-selected');
            selectedResult = clickedCard; // Store the selected card element

            // Show the confirmation button
            ui.confirmButtonContainer.classList.remove('hidden');
        }
    };
     
    /**
     * (Đã cập nhật) Opens the contact popup.
     */
    const openPopup = () => {
        if (!selectedResult) return; 

        const region = ui.regionSelect.value; // Get region value
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes';
        // Store selected system info in hidden input
        const systemType = selectedResult.dataset.resultType;
        const details = JSON.parse(selectedResult.dataset.resultDetails || '{}');
        let infoString = `Khu vực: ${region}\nLoại hệ thống: ${systemType}`; // Add region
        if (details.option) { // Use option number if available
            infoString += `\nPhương án: ${details.option}`;
        }
        // Add more details from the dataset
        if (details.capacity) infoString += `\nCông suất: ${details.capacity} kWp`;
        if (details.saving) infoString += `\nTiết kiệm: ${formatter.format(details.saving)} VND/tháng`; // Format saving
        if (details.packs) infoString += `\nSố pack: ${details.packs}`;
        
        if (knowsRoof) { // If user provided roof area
            infoString += `\nDiện tích mái (đã nhập): ${ui.roofAreaInput.value} m²`;
        } else if (details.roofArea) { // If we calculated it
            infoString += `\nDiện tích mái (ước tính): ${details.roofArea} m²`; // Add roof area
        }
        
        ui.popup.selectedSystemInput.value = infoString;

        ui.popup.overlay.classList.add('active');
    };

    /**
     * Closes the contact popup.
     */
    const closePopup = () => {
        ui.popup.overlay.classList.remove('active');
        document.getElementById('contact-form').reset();
        ui.popup.phoneError.classList.add('hidden');
        ui.popup.popupErrorMessage.textContent = ''; // Clear error message on close
    };

     /**
     * Opens the image popup with a specific image source.
     * @param {string} src - The URL of the image to display.
     */
    const openImagePopup = (src) => {
        ui.popup.imageContent.src = src;
        ui.popup.imageOverlay.classList.add('active');
    };

    /**
     * Closes the image popup.
     */
    const closeImagePopup = () => {
        ui.popup.imageOverlay.classList.remove('active');
        ui.popup.imageContent.src = ""; // Clear src to stop loading/gif
    };

    /**
     * Formats the pack count to always have two digits.
     * @param {number} count - The number of packs.
     * @returns {string} - The formatted pack count string.
     */
    const formatPackCount = (count) => {
        const safeCount = Math.max(0, count);
        return String(safeCount).padStart(2, '0');
    };

    /**
     * Rounds the saving amount based on the specified rules.
     * @param {number} amount - The calculated saving amount.
     * @returns {number} - The rounded saving amount.
     */
    const roundSavingAmount = (amount) => {
        if (amount < 500000) {
            return 500000;
        } else {
            return Math.floor(amount / 500000) * 500000;
        }
    };

    /**
     * Maps the original level (50, 70, 90) to the display option number (1, 2, 3)
     * based on the filtered and sorted list.
     * @param {number} level - The original level (50, 70, 90).
     * @param {Array} filteredPackages - The final list of packages to display.
     * @returns {number} - The display option number (1, 2, or 3).
     */
    const mapLevelToOptionNumber = (level, filteredPackages) => {
        const index = filteredPackages.findIndex(pkg => pkg.level === level);
        return index + 1; // Return 1-based index
    };

    /**
     * (Đã cập nhật) Recalculates everything based on form inputs.
     */
    const calculateAndDisplayResults = () => {
        ui.errorMessage.textContent = '';
        clearResultSelection(); 
        
        const { isValid, errorKey } = validateInputs();
        if (!isValid) {
            ui.errorMessage.textContent = currentTranslations[errorKey]; // Cập nhật
            ui.resultsSection.classList.add('hidden');
            return;
        }
        
        const bill = parseFloat(ui.billInput.value.replace(/\./g, ''));
        const evnPrice = parseFloat(ui.hiddenPriceType.value);
        const dayUsage = parseFloat(ui.dayUsageSlider.value); 
        const dayUsagePercent = dayUsage / 100;
        const panelPower = parseFloat(ui.panelPowerInput.value); 
        const panelPowerKw = panelPower / 1000; 
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes'; // Get roof choice
        const roofAreaInputValue = parseFloat(ui.roofAreaInput.value);

        // Determine max panels from roof if specified
        let maxPanelsFromRoof = Infinity;
        if (knowsRoof && !isNaN(roofAreaInputValue) && roofAreaInputValue > 0) {
            maxPanelsFromRoof = Math.floor(roofAreaInputValue / PANEL_AREA_SQM);
        }

        const totalKwhPerDay = (bill / 30) / evnPrice;
        const dayKwh = totalKwhPerDay * dayUsagePercent;
        const nightKwh = totalKwhPerDay * (1 - dayUsagePercent);

        const timeOfDay = (dayKwh >= nightKwh) ? 'day' : 'night';
        
        const maxPacks = Math.floor(nightKwh / 5);
        ui.maxPacksDisplay.textContent = formatPackCount(maxPacks); 

        // Calculate initial Ongrid system
        const idealOngridCapacity = dayKwh / 4;
        let idealOngridPanels = Math.floor(idealOngridCapacity / panelPowerKw);
        
        // Apply roof limit
        let ongridPanels = Math.min(idealOngridPanels, maxPanelsFromRoof);

        ongridPanels = adjustPanelCountOngrid(ongridPanels); // Apply adjustment ONLY to Ongrid

        // Final check: adjusted panels might exceed roof limit
        if (ongridPanels > maxPanelsFromRoof) {
            ongridPanels = maxPanelsFromRoof; 
        }

        const finalOngridCapacity = ongridPanels * panelPowerKw; 
        const rawOngridSaving = finalOngridCapacity * 4 * evnPrice * 30;
        const finalOngridSaving = roundSavingAmount(rawOngridSaving); 
        const ongridRoofArea = ongridPanels * PANEL_AREA_SQM; 

        const isOngridValid = finalOngridCapacity >= 3;

        // Store calculations
        calculationState = { 
            evnPrice, dayKwh, nightKwh,
            ongrid: { 
                capacity: finalOngridCapacity, 
                saving: finalOngridSaving,
                roofArea: ongridRoofArea 
            }, 
            hybrid: {}
        };

        // Calculate Hybrid systems
        const maxStorageCapacity = nightKwh / 4; 
        let validHybridPackages = [];
        
        [50, 70, 90].forEach(level => {
            const targetStorageForLevel = maxStorageCapacity * (level / 100);
            const totalTargetCapacityForLevel = finalOngridCapacity + targetStorageForLevel;

            let idealHybridPanels = Math.floor(totalTargetCapacityForLevel / panelPowerKw);
            
            // Apply roof limit
            let hybridPanels = Math.min(idealHybridPanels, maxPanelsFromRoof);
            
            const finalHybridCapacity = hybridPanels * panelPowerKw; 
            const hybridRoofArea = hybridPanels * PANEL_AREA_SQM; 
            const rawHybridSaving = finalHybridCapacity * 4 * evnPrice * 30;
            const finalHybridSaving = roundSavingAmount(rawHybridSaving); 
            
            const additionalCapacity = finalHybridCapacity - finalOngridCapacity;
            
            // CÔNG THỨC MỚI: (capacity * 4 hours * 0.9 efficiency)
            const bessEnergyCovered = (additionalCapacity > 0 ? additionalCapacity : 0) * 4 * 0.9; 
            const bessPacks = Math.round(bessEnergyCovered / 5);

            if (finalHybridCapacity >= 3 && bessPacks > 0 && finalHybridCapacity > finalOngridCapacity) { 
                const packageData = {
                    level: level, 
                    capacity: finalHybridCapacity,
                    saving: finalHybridSaving, 
                    packs: bessPacks,
                    roofArea: hybridRoofArea 
                };
                calculationState.hybrid[level] = packageData;
                validHybridPackages.push(packageData);
            } else {
                calculationState.hybrid[level] = null;
            }
        });
        
         // Filter Hybrid packages
        const filteredHybridPackages = [];
        const packCountMap = {}; 
        validHybridPackages.sort((a, b) => b.level - a.level); 
        validHybridPackages.forEach(pkg => {
            if (!packCountMap[pkg.packs]) { 
                filteredHybridPackages.push(pkg);
                packCountMap[pkg.packs] = pkg.level; 
            }
        });
        filteredHybridPackages.sort((a, b) => a.level - b.level);

        const isHybridValid = filteredHybridPackages.length > 0; 

        // --- Check if any system is valid ---
        if (!isOngridValid && !isHybridValid) {
            ui.errorMessage.textContent = currentTranslations['error_no_valid_system']; // Cập nhật
            ui.resultsSection.classList.add('hidden');
            return;
        }

        // --- Update UI ---
        document.getElementById('day-kwh').textContent = dayKwh.toFixed(2);
        document.getElementById('night-kwh').textContent = nightKwh.toFixed(2);
        
        // Update Ongrid UI & Data Attributes
        const ongridCard = ui.results.ongrid.querySelector('.result-card');
        if (ongridCard) {
             ongridCard.dataset.resultDetails = JSON.stringify({
                type: 'ongrid',
                capacity: calculationState.ongrid.capacity.toFixed(2),
                saving: calculationState.ongrid.saving, 
                roofArea: calculationState.ongrid.roofArea.toFixed(2) 
            });
             ui.ongridResultImage.src = resultImages.ongrid[timeOfDay];
        }
        ui.results.ongridRoofAreaWrapper.classList.toggle('hidden', knowsRoof); // Toggle based on choice
        document.getElementById('ongrid-capacity').textContent = calculationState.ongrid.capacity.toFixed(2);
        document.getElementById('ongrid-saving').textContent = formatter.format(calculationState.ongrid.saving); 
        document.getElementById('ongrid-roof-area').textContent = calculationState.ongrid.roofArea.toFixed(2); 

        // Update Hybrid UI & Data Attributes
        [ui.results.hybridSingle, ui.results.hybridGrid, 
         document.getElementById('hybrid-card-50'), 
         document.getElementById('hybrid-card-70'), 
         document.getElementById('hybrid-card-90')]
         .forEach(el => el.classList.add('hidden'));

        if (filteredHybridPackages.length === 1) { 
            const pkg = filteredHybridPackages[0]; 
            const singleCard = ui.results.hybridSingle;
            const optionNumber = mapLevelToOptionNumber(pkg.level, filteredHybridPackages); 
            
            singleCard.dataset.resultDetails = JSON.stringify({
                type: 'hybrid',
                option: optionNumber, 
                capacity: pkg.capacity.toFixed(2),
                saving: pkg.saving, 
                packs: pkg.packs,
                roofArea: pkg.roofArea.toFixed(2) 
            });
             singleCard.dataset.resultType = `hybrid-option-${optionNumber}`; 
             
            document.getElementById('hybrid-single-title').textContent = `${currentTranslations['hybrid_title_short']} - ${currentTranslations[`hybrid_option_${optionNumber}`] || `Phương án ${optionNumber}`}`; // Cập nhật

            document.getElementById('hybrid-single-capacity').textContent = pkg.capacity.toFixed(2);
            document.getElementById('hybrid-single-saving').textContent = formatter.format(pkg.saving); 
            document.getElementById('hybrid-single-packs').textContent = formatPackCount(pkg.packs); 
            document.getElementById('hybrid-single-roof-area').textContent = pkg.roofArea.toFixed(2); 
            ui.results.hybridSingleRoofAreaWrapper.classList.toggle('hidden', knowsRoof); // Toggle based on choice

            if(ui.hybridSingleImage) {
                ui.hybridSingleImage.src = resultImages.hybrid[pkg.level][timeOfDay];
            }
            singleCard.classList.remove('hidden');

        } else if (filteredHybridPackages.length > 1) { 
            ui.results.hybridGrid.classList.remove('hidden');
            if (filteredHybridPackages.length === 2) { 
                ui.results.hybridGrid.classList.remove('md:grid-cols-3');
                ui.results.hybridGrid.classList.add('md:grid-cols-2', 'max-w-3xl', 'mx-auto');
            } else {
                ui.results.hybridGrid.classList.remove('md:grid-cols-2', 'max-w-3xl', 'mx-auto');
                ui.results.hybridGrid.classList.add('md:grid-cols-3');
            }
            filteredHybridPackages.forEach(pkg => { 
                const card = document.getElementById(`hybrid-card-${pkg.level}`); 
                const optionNumber = mapLevelToOptionNumber(pkg.level, filteredHybridPackages); 
                 
                card.dataset.resultDetails = JSON.stringify({
                     type: 'hybrid',
                     option: optionNumber, 
                     capacity: pkg.capacity.toFixed(2),
                     saving: pkg.saving, 
                     packs: pkg.packs,
                     roofArea: pkg.roofArea.toFixed(2) 
                 });
                 
                const titleElement = card.querySelector('h3');
                if(titleElement) {
                     titleElement.textContent = currentTranslations[`hybrid_option_${optionNumber}`] || `Phương án ${optionNumber}`; // Cập nhật
                     titleElement.dataset.translate = `hybrid_option_${optionNumber}`; 
                }

                document.getElementById(`hybrid-capacity-${pkg.level}`).textContent = pkg.capacity.toFixed(2);
                document.getElementById(`hybrid-saving-${pkg.level}`).textContent = formatter.format(pkg.saving); 
                document.getElementById(`bess-packs-${pkg.level}`).textContent = formatPackCount(pkg.packs); 
                document.getElementById(`hybrid-roof-area-${pkg.level}`).textContent = pkg.roofArea.toFixed(2); 
                ui.results.hybridRoofAreaWrappers[pkg.level].classList.toggle('hidden', knowsRoof); // Toggle based on choice
                
                const imgEl = document.getElementById(`hybrid-image-${pkg.level}`);
                if (imgEl) {
                    imgEl.src = resultImages.hybrid[pkg.level][timeOfDay];
                }
                card.classList.remove('hidden');
            });
        }
        
        // Handle Toggle Switch state
        ui.resultToggle.optionOngrid.classList.toggle('disabled', !isOngridValid);
        ui.resultToggle.optionHybrid.classList.toggle('disabled', !isHybridValid); 

        // Show results and switch to a valid view
        if (isOngridValid) {
            switchResultView('ongrid');
        } else {
            switchResultView('hybrid'); 
        }
        
        ui.resultsSection.classList.remove('hidden');
        ui.panelPackInfo.classList.remove('hidden'); 
    };


    // --- EVENT LISTENERS ---
    
    // (MỚI) Tải ngôn ngữ mặc định (vi)
    await switchLanguage('vi');

    // Form submission
    ui.form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndDisplayResults();
        if (!ui.resultsSection.classList.contains('hidden')) {
            ui.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Bill input formatting
    ui.billInput.addEventListener('input', (e) => {
        let numValue = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = numValue ? formatter.format(numValue) : '';
    });

    // Price type selection
    const optionBoxes = ui.priceTypeOptions.querySelectorAll('.option-box');
    optionBoxes.forEach(box => {
        box.addEventListener('click', () => {
            optionBoxes.forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            ui.hiddenPriceType.value = box.dataset.value;
        });
    });
    
     // Set initial selection state for price type
    const initialSelected = ui.priceTypeOptions.querySelector('.option-box[data-value="3500"]');
    if(initialSelected) initialSelected.classList.add('selected');

    // Day Usage Slider update
    ui.dayUsageSlider.addEventListener('input', (e) => {
        ui.dayUsageValue.textContent = `${e.target.value}%`;
         if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });
    
    // Roof Area Choice
    ui.roofChoiceOptions.addEventListener('click', (e) => {
        const clickedBox = e.target.closest('.option-box');
        if (!clickedBox) return;

        ui.roofChoiceOptions.querySelectorAll('.option-box').forEach(box => box.classList.remove('selected'));
        clickedBox.classList.add('selected');

        const choice = clickedBox.dataset.roofChoice;
        if (choice === 'yes') {
            ui.roofAreaInputWrapper.classList.remove('hidden');
        } else {
            ui.roofAreaInputWrapper.classList.add('hidden');
            ui.roofAreaInput.value = ''; // Clear input if user selects "No"
        }

        // Re-calculate results if already visible
        if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });


    // Language switcher logic
    ui.langSwitcher.button.addEventListener('click', () => {
        ui.langSwitcher.menu.classList.toggle('hidden');
    });
    ui.langSwitcher.menu.addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('[data-lang]');
        if (link) switchLanguage(link.dataset.lang);
    });
    document.addEventListener('click', (e) => {
        if (ui.langSwitcher.container && !ui.langSwitcher.container.contains(e.target)) {
            if (ui.langSwitcher.menu && !ui.langSwitcher.menu.classList.contains('hidden')) {
                 ui.langSwitcher.menu.classList.add('hidden');
            }
        }
    });

    // Result Toggle Switch Logic
    ui.resultToggle.toggle.addEventListener('click', (e) => {
        const option = e.target.closest('.toggle-switch-option');
        if (!option || option.classList.contains('disabled')) {
            return; 
        }
        switchResultView(option.dataset.type);
    });

    // Result Card Selection
    document.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', handleResultSelection);
    });

    // Confirmation Button Click
    ui.confirmButton.addEventListener('click', openPopup);


    // Panel Power Input Change
    ui.panelPowerInput.addEventListener('input', () => {
        if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });

     // --- Popup Logic ---
    ui.popup.closeButton.addEventListener('click', closePopup);
    ui.popup.overlay.addEventListener('click', (e) => {
        if (e.target === ui.popup.overlay) { 
            closePopup();
        }
    });

    // --- Image Popup Logic ---
    ui.popup.closeImageButton.addEventListener('click', closeImagePopup);
    ui.popup.imageOverlay.addEventListener('click', (e) => {
        if (e.target === ui.popup.imageOverlay) { 
            closeImagePopup();
        }
    });

    // Event delegation for all 'view-image-button' clicks
    ui.resultsSection.addEventListener('click', (e) => {
        const button = e.target.closest('.view-image-button');
        if (!button) return;

        e.preventDefault();
        e.stopPropagation(); 
        const image = button.closest('.relative').querySelector('img');
        if (image && image.src) {
            openImagePopup(image.src);
        }
    });


     // Phone input validation (only numbers on keypress)
    ui.popup.phoneInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        if (value !== numericValue) {
            e.target.value = numericValue; 
        }
        // Hide format error message while typing
        ui.popup.phoneError.classList.add('hidden');
    });

    // (Đã cập nhật) Popup form submission
    ui.popup.form.addEventListener('submit', async (e) => {
         e.preventDefault(); // Prevent default form submission
         
         // Reset error message
         ui.popup.popupErrorMessage.textContent = '';
         
         // Basic validation check
         if (!ui.popup.phoneInput.value.match(/^0\d{9}$/)) { // Updated regex
            ui.popup.phoneError.textContent = currentTranslations['popup_phone_error_format'] || 'Vui lòng nhập SĐT 10 số, bắt đầu bằng 0.'; // Set specific error text
            ui.popup.phoneError.classList.remove('hidden');
            return;
         }
         
         // Show loading state
         const originalButtonText = ui.popup.submitButton.textContent;
         ui.popup.submitButton.textContent = currentTranslations['popup_submitting_button'] || 'Đang gửi...';
         ui.popup.submitButton.disabled = true;

        // 1. Gather all data
        const formData = {
            _subject: "Đăng ký tư vấn lắp đặt - Từ Web Calculator",
            // Form data
            "Họ và Tên": ui.popup.nameInput.value,
            "Số điện thoại": ui.popup.phoneInput.value,
            "Khu vực": ui.regionSelect.value,
            "Hóa đơn hàng tháng": ui.billInput.value,
            "Loại giá điện": ui.hiddenPriceType.value === '3500' ? 'Sinh hoạt' : 'Kinh doanh',
            "Tỷ lệ sử dụng ban ngày": `${ui.dayUsageSlider.value}%`,
            "Biết diện tích mái": ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes' ? 'Có' : 'Không', // Added
            "Diện tích mái (đã nhập)": ui.roofAreaInput.value || 'N/A', // Added
            
            // Selected system
            "Hệ thống đã chọn": ui.popup.selectedSystemInput.value
        };

        try {
            // 2. Send data to Formspree
            const response = await fetch(`https://formspree.io/f/${FORMSPREE_ENDPOINT}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });


            if (response.ok) {
                // 3. Handle Success
                console.log('Form Submitted Successfully!');
                closePopup();

                // Show toast notification
                ui.toast.textContent = currentTranslations['toast_message']; // Set correct message
                ui.toast.classList.remove('opacity-0');
                setTimeout(() => {
                    ui.toast.classList.add('opacity-0');
                }, 3000); // Hide after 3 seconds

            } else {
                // 4. Handle Formspree Error
                const result = await response.json();
                console.error("Form submission error:", result);
                ui.popup.popupErrorMessage.textContent = currentTranslations['popup_error_message'];
            }

        } catch (error) {
            // 5. Handle Network Error
            console.error("Network error:", error);
            ui.popup.popupErrorMessage.textContent = currentTranslations['popup_error_message'];
        } finally {
            // 6. Reset button state
            ui.popup.submitButton.textContent = originalButtonText;
            ui.popup.submitButton.disabled = false;
        }
    });

});