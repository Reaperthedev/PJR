
// Function to check if the session cookie exists
function checkSessionCookie() {
    const sessionCookie = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('session='));

        if (!sessionCookie) {
            // Redirect to the main page if session cookie does not exist
            window.location.href = '/';
        }
    }

    // Call the function when the page loads
    window.onload = checkSessionCookie;