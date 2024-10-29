document.addEventListener('DOMContentLoaded', function () {

    // Add this element to display the note
    function showActivationWarning() {
        const warningElement = document.createElement('div');
        warningElement.id = 'activationWarning';
        warningElement.innerHTML = 'You must verify your activation key before you can generate content.';
        warningElement.style.color = 'red';
        warningElement.style.marginTop = '10px';
        document.getElementById('generatePostNow').parentElement.appendChild(warningElement);
    }

    function disableActivationKeyElements() {
        document.getElementById('verifyActivationKey').style.display = 'none';
    }

    function showMessage(message, isSuccess) {
        const statusElement = document.getElementById('activationStatus');
        statusElement.innerHTML = `<span style="color: ${isSuccess ? 'green' : 'red'};">${message}</span>`;
        statusElement.style.display = 'block'; // Make sure the message is visible

        // Hide the message after 5 seconds (adjust as needed)
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }

    if (autocontent_vars.activation_status === 'verified') {
        disableActivationKeyElements();
    } else {
        // Show the activation warning if not verified
        showActivationWarning();

        // Disable the generatePostNow button to prevent content generation
        document.getElementById('generatePostNow').disabled = true;
    }

    document.getElementById('verifyActivationKey').addEventListener('click', function () {
        var activationKey = document.getElementsByName('autocontent_activation_key')[0].value;
        // First, update the activation key option in the backend
        updateActivationKeyOption(activationKey)
            .then(() => {
                // Proceed with verification once the key is updated
                verifyActivationKey(activationKey);
            })
            .catch(error => {
                console.error('Error updating activation key:', error);
                showMessage('Failed to update Activation Key &#10005;', false);
            });
    });

    function updateActivationKeyOption(activationKey) {
        return fetch(autocontent_vars.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'update_activation_key_option',
                activation_key: activationKey,
                nonce: autocontent_vars.update_activation_key_nonce, // Ensure you pass the correct nonce for security
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to update the activation key option');
            }
            return response.text(); // Assuming the server sends a text response
        });
    }

    function verifyActivationKey(activationKey) {
        var currentUrl = window.location.href;
        var currentDomain = new URL(currentUrl).hostname;
        var apiUrl = 'https://autocontent.com/api/activate.php/verify';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Activation-Key': activationKey,
            },
            body: JSON.stringify({
                'Origin': currentDomain,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.isValid) {
                showMessage('Activation Key is Valid &#10003;', true);
                disableActivationKeyElements();
                document.getElementById('generatePostNow').disabled = false; // Re-enable the button
                document.getElementById('activationWarning').remove(); // Remove the warning

                return fetch(autocontent_vars.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'update_activation_status',
                        status: 'verified',
                        frequency: data.frequency,
                        nonce: autocontent_vars.update_activation_nonce,
                    })
                });
            } else {
                showMessage('Activation Key is Invalid &#10005;', false);
                throw new Error('Invalid Activation Key');
            }
        })
        .then(response => response.text())
        .then(data => {
            console.log(data); // Log the response for debugging
            handleScheduleUpdate();
        })
        .then(() => {
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Activation Key is Invalid &#10005;', false);
        });
    }

    function handleScheduleUpdate() {
        fetch(autocontent_vars.ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'schedule_setup',
                nonce: autocontent_vars.schedule_setup_nonce,
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    document.getElementById('generatePostNow').addEventListener('click', function () {
        // Show processing spinner or loader
        document.getElementById('processingContainer').style.display = 'block';
        
        // Construct the AJAX URL for WordPress admin AJAX
        var currentDomain = window.location.origin;
        var ajax_url = currentDomain + '/wp-admin/admin-ajax.php';
    
        // Step 1: Check autocontent_credits before generating the post
        fetch(ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'check_autocontent_credits', // Custom action to check credits
                nonce: autocontent_vars.check_credits_nonce, // Pass the security nonce
                CallType: 'manual'
            })
        })
        .then(response => response.json())
        .then(data => {
            // Hide processing spinner or loader
            document.getElementById('processingContainer').style.display = 'none';

            // Convert the credits value to an integer for accurate comparison
            var credits = parseInt(data.data.credits, 10);

            if (credits > 0) {
                // If credits are greater than 0, proceed with post generation
                generatePostNow();
            } else {
                // Show failed modal if credits are 0 or less
                showModal(false); // No post URL, so the modal will show the failure message
            }
        })
        .catch(error => {
            console.error('Error checking credits:', error);
            document.getElementById('processingContainer').style.display = 'none';
        });
    });
    
    function generatePostNow() {
        // Show processing spinner or loader
        document.getElementById('processingContainer').style.display = 'block';
        
        // Construct the AJAX URL for generating the post
        var currentDomain = window.location.origin;
        var ajax_url = currentDomain + '/wp-admin/admin-ajax.php';
        
        fetch(ajax_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'autocontent_generate_post_now',
                nonce: autocontent_vars.nonce,
                CallType: 'manual'
            })
        })
        .then(response => response.json())
        .then(data => {
            // Hide processing spinner or loader
            document.getElementById('processingContainer').style.display = 'none';
            
            if (data.success) {
                console.log('Post URL:', data.data.post_url); // Debugging line
                showModal(data.data.post_url); // Show success modal with the post URL
            } else {
                showModal(false); // Show failed modal since post generation failed
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('processingContainer').style.display = 'none';
            showModal(false); // Show failed modal in case of any error
        });
    }
    
    function showModal(postUrl) {
        
        // Create the modal HTML
        var modalHtml = '<div id="postModal" class="modal">' +
            '<div class="modal-content">' +
            '<span class="close">&times;</span>';
        
        if (!postUrl) {
            // If postUrl is false, show "Failed to Post"
            modalHtml += '<p>Failed to generate post: Insufficient WriteNow credits</p>';
        } else {
            // If postUrl is valid, show success message with the link
            modalHtml += '<p>Post generated successfully!</p>' +
                         '<a href="' + postUrl + '" target="_blank">Go to Post</a>';
        }
        
        modalHtml += '</div>' +
            '</div>';
        
        // Insert modal HTML into the body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        var modal = document.getElementById("postModal");
        var span = document.getElementsByClassName("close")[0];
        
        // Display the modal
        modal.style.display = "block";
        
        // Close the modal when the "x" button is clicked
        span.onclick = function () {
            modal.style.display = "none";
            modal.remove();
        }
        
        // Close the modal if the user clicks outside of it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
                modal.remove();
            }
        }
        
        // Automatically remove modal after 10 seconds
        setTimeout(function() {
            modal.style.display = "none";
            modal.remove();
        }, 10000);
    }        

    window.openTab = function (tabName) {
        jQuery('.tab-content').hide();
        jQuery('#' + tabName).show();
    };

    if (jQuery('.tab-content').length) {
        openTab('autoContentTab');
    }

    // Get the notice element
    const noticeElement = document.getElementById('setting-error-settings_updated');

    // Check if the notice element exists
    if (noticeElement) {
        // Set a timeout to hide the notice after 5 seconds
        setTimeout(function () {
            noticeElement.style.display = 'none';
        }, 5000); // 5000 milliseconds = 5 seconds
    }
});