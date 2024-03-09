
            async function deleteSportkurs() {
                const selectElement = document.getElementById('sportkursSelect');
                const selectedId = selectElement.value;
        
                if (!selectedId) {
                    alert('Bitte wählen Sie einen Sportkurs zum Löschen aus.');
                    return;
                }
        
                try {
                    const response = await fetch(`/deleteSportkurs/${selectedId}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) {
                        throw new Error('Löschen des Sportkurses fehlgeschlagen.');
                    }
                    alert('Sportkurs erfolgreich gelöscht.');
                    // Optionally, update the UI or perform any other action after successful deletion
                } catch (error) {
                    console.error('Fehler:', error);
                    alert('Löschen des Sportkurses fehlgeschlagen. Bitte versuchen Sie es erneut.');
                }
            }
        
            // Function to populate the select dropdown with sportkurs options
            async function populateSportkursOptions() {
                try {
                    const response = await fetch('/getSportkurse');
                    if (!response.ok) {
                        throw new Error('Fehler beim Abrufen der Sportkurse.');
                    }
                    const data = await response.json();
        
                    const selectElement = document.getElementById('sportkursSelect');
                    selectElement.innerHTML = '<option value="">Wählen Sie einen Sportkurs aus</option>';
                    data.forEach(sportkurs => {
                        const option = document.createElement('option');
                        option.value = sportkurs.id;
                        option.textContent = sportkurs.sportkurs;
                        selectElement.appendChild(option);
                    });
                } catch (error) {
                    console.error('Fehler:', error);
                    alert('Fehler beim Abrufen der Sportkurse. Bitte versuchen Sie es erneut.');
                }
            }
        
            // Call the function to populate sportkurs options when the page loads
            window.onload = populateSportkursOptions;

            document.getElementById('sportkursForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const formObject = {};
                formData.forEach((value, key) => {
                    formObject[key] = value;
                });

                try {
                    const response = await fetch('/addSportkurs', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formObject)
                    });
                    const data = await response.json();
                    console.log(data);
                    // Handle success or show response message
                } catch (error) {
                    console.error('Error:', error);
                    // Handle error or show error message
                }
            });
