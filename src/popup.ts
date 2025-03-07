// Popup script for Elk New Tab Extension

document.addEventListener('DOMContentLoaded', () => {
    // References to DOM elements
    const backgroundUploader = document.getElementById('backgroundUploader') as HTMLInputElement;
    const removeBackgroundBtn = document.getElementById('removeBackground');
    const addBackgroundBtn = document.getElementById('addBackground');
    const shuffleModeBtn = document.getElementById('shuffleMode');
    const backgroundList = document.getElementById('backgroundList');
    const randomSolidColorBtn = document.getElementById('randomSolidColor');
    const randomGradientBtn = document.getElementById('randomGradient');
    const gradientOptions = document.querySelectorAll('.gradient-option');
    const cyclingEnabledCheckbox = document.getElementById('cyclingEnabled') as HTMLInputElement;
    const cyclingIntervalInput = document.getElementById('cyclingInterval') as HTMLInputElement;
    const dropzone = document.querySelector('.dropzone');

    // Initialize state
    let backgrounds: string[] = [];
    let selectedGradientType = 'linear';

    // Load saved settings
    const loadSettings = () => {
        chrome.storage.sync.get([
            'backgrounds',
            'selectedGradientType',
            'cyclingEnabled',
            'cyclingInterval'
        ], (result) => {
            backgrounds = result.backgrounds || [];
            selectedGradientType = result.selectedGradientType || 'linear';
            cyclingEnabledCheckbox.checked = result.cyclingEnabled || false;
            cyclingIntervalInput.value = result.cyclingInterval || '30';

            // Update UI based on loaded settings
            updateBackgroundsList();
            updateGradientOptions();
        });
    };

    // Save settings to chrome.storage
    const saveSettings = () => {
        chrome.storage.sync.set({
            backgrounds,
            selectedGradientType,
            cyclingEnabled: cyclingEnabledCheckbox.checked,
            cyclingInterval: cyclingIntervalInput.value
        });
    };

    // Update the backgrounds list in the UI
    const updateBackgroundsList = () => {
        if (!backgroundList) return;

        backgroundList.innerHTML = '';
        backgrounds.forEach((_, index) => {
            const li = document.createElement('li');
            li.textContent = `Background ${index + 1}`;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                backgrounds.splice(index, 1);
                saveSettings();
                updateBackgroundsList();
            });

            li.appendChild(removeBtn);
            backgroundList.appendChild(li);
        });
    };

    // Update gradient options in the UI
    const updateGradientOptions = () => {
        gradientOptions.forEach((option) => {
            const gradientType = option.getAttribute('data-gradient');
            if (gradientType === selectedGradientType) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    };

    // Event Listeners
    if (backgroundUploader) {
        backgroundUploader.addEventListener('change', (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                backgrounds.push(result);
                saveSettings();
                updateBackgroundsList();
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBackgroundBtn) {
        removeBackgroundBtn.addEventListener('click', () => {
            chrome.storage.sync.remove('currentBackground');
            alert('Background removed');
        });
    }

    if (addBackgroundBtn) {
        addBackgroundBtn.addEventListener('click', () => {
            backgroundUploader?.click();
        });
    }

    if (shuffleModeBtn) {
        shuffleModeBtn.addEventListener('click', () => {
            chrome.storage.sync.set({ shuffleMode: true });
            alert('Shuffle mode enabled');
        });
    }

    if (randomSolidColorBtn) {
        randomSolidColorBtn.addEventListener('click', () => {
            chrome.storage.sync.set({
                backgroundType: 'randomColor',
                randomType: 'solid'
            });
            alert('Random solid color mode enabled');
        });
    }

    if (randomGradientBtn) {
        randomGradientBtn.addEventListener('click', () => {
            chrome.storage.sync.set({
                backgroundType: 'randomColor',
                randomType: 'gradient',
                gradientType: selectedGradientType
            });
            alert('Random gradient mode enabled');
        });
    }

    gradientOptions.forEach(option => {
        option.addEventListener('click', (e: Event) => {
            const target = e.currentTarget as HTMLElement;
            const gradientType = target.getAttribute('data-gradient');
            if (gradientType) {
                selectedGradientType = gradientType;
                saveSettings();
                updateGradientOptions();
            }
        });
    });

    if (cyclingEnabledCheckbox) {
        cyclingEnabledCheckbox.addEventListener('change', saveSettings);
    }

    if (cyclingIntervalInput) {
        cyclingIntervalInput.addEventListener('input', saveSettings);
    }

    // Drag and drop functionality
    if (dropzone) {
        dropzone.addEventListener('dragover', (e: Event) => {
            e.preventDefault();
            dropzone.classList.add('active');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('active');
        });

        dropzone.addEventListener('drop', (e: Event) => {
            e.preventDefault();
            dropzone.classList.remove('active');

            // Cast to DragEvent to access dataTransfer
            const dragEvent = e as unknown as DragEvent;
            if (dragEvent.dataTransfer && dragEvent.dataTransfer.files.length > 0) {
                const file = dragEvent.dataTransfer.files[0];
                const reader = new FileReader();

                reader.onloadend = () => {
                    const result = reader.result as string;
                    backgrounds.push(result);
                    saveSettings();
                    updateBackgroundsList();
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // Initialize
    loadSettings();
});