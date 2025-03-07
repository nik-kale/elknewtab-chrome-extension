document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded");

    const openSettingsBtn = document.getElementById('openSettings');
    console.log("Button found:", openSettingsBtn);

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Settings button clicked");

            // First try the recommended way using chrome.tabs API
            if (chrome && chrome.tabs) {
                try {
                    // Create a new tab with the extension's index.html page
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('index.html')
                    }, function(tab) {
                        console.log("New tab created:", tab);
                        window.close(); // Close the popup
                    });
                } catch (error) {
                    console.error("Chrome tabs API error:", error);
                    tryFallbackMethod();
                }
            } else {
                console.warn("Chrome tabs API not available, trying fallback");
                tryFallbackMethod();
            }
        });

        // Add alternative direct click method
        document.querySelector('.container').addEventListener('click', function(e) {
            if (e.target && e.target.id === 'openSettings') {
                console.log("Button clicked via container delegation");
            }
        });
    } else {
        console.error("Open Settings button not found in the DOM");
    }

    function tryFallbackMethod() {
        try {
            // Try a direct window.open approach
            const newTab = window.open(chrome.runtime.getURL('index.html'), '_blank');
            if (newTab) {
                window.close(); // Close the popup
            } else {
                console.error("Could not open new tab - likely blocked by popup blocker");
                alert("Could not open settings. Please try clicking the extension icon and selecting 'Open in new tab'.");
            }
        } catch (err) {
            console.error("All methods failed:", err);
            // If all else fails, provide guidance to the user
            alert("Unable to open settings tab. Please open a new tab and click the extension icon again.");
        }
    }
});