document.addEventListener('DOMContentLoaded', () => {
    const createDiv = document.createElement('div');
    createDiv.setAttribute('id', 'create-div');
    createDiv.className = 'create-container border border-secondary-subtle rounded';
    createDiv.innerHTML = `
                        <h3>Create Board</h3>
                        <form id="create-board">
                            <input type="text" class="form-control" name="title" id="title" placeholder="Board Title" required aria-required="true">
                            <select name="visibility" id="visibility" class="form-select" aria-label="Select visibility">
                                <option value="Public">Public</option>
                                <option value="Private">Private</option>
                            </select>
                            <span class='create-status text-danger px-2' style='font-size: 0.8em';></span>
                        </form>
                        <button class="btn btn-primary submit-create">Create</button>
                    `;
    document.body.appendChild(createDiv);
    const createBtns = document.querySelectorAll('.create-button');
    if (createBtns != null) {
        createBtns.forEach(createBtn => {
            createBtn.addEventListener('click', () => {
                let isCreateDivDisplay = false;
                window.getComputedStyle(createDiv).display === 'none' ? isCreateDivDisplay = false : isCreateDivDisplay = true;
                if (isCreateDivDisplay) {
                    createDiv.style.display = 'none';
                } else {
                    createDiv.style.display = 'flex';
                    const createBoard = document.querySelector('#create-board');
                    createBoard.querySelector('#title').value = '';
                    createBoard.querySelector('#title').style.border = '1px solid #dee2e6';
                    createBoard.addEventListener('submit', (event) => {
                    event.preventDefault();
                    });
                    document.body.addEventListener('click', function addBoardCheckBody(event) {
                        const createContainer = document.querySelector('.create-container');
                        if (!createContainer.contains(event.target) && !event.target.classList.contains('create-button')) {
                            createDiv.style.display = 'none';
                            document.body.removeEventListener('click', addBoardCheckBody);
                        }
                    });
                }
            });
        })     
    } 

    const submitBtn = document.querySelector('.submit-create');
    if (submitBtn != null) {
        submitBtn.addEventListener('click', () => {
            const title = document.getElementById('title').value;
            const visibility = document.getElementById('visibility').value;
            fetch('/board/', {
                method: "POST",
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'    
                },
                body: JSON.stringify({
                    'title': title.toLowerCase(),
                    'visibility': visibility
                })
            })
            .then(response => {
                    return response.json().then(data => {
                    data.status = response.status;
                    return data;
                });
            })
            .then(data => {
                if (data.status === 201) {
                    const redirect = `/render/${data['slug']}/`;
                    window.location.href = redirect;
                } else {
                    const createBoard = document.querySelector('#create-board');
                    createBoard.querySelector('#title').style.border = '1px solid #ff00006e';
                    document.querySelector('.create-status').innerText = data.detail;
                    throw new Error('Request failed with status: ' + data.status);
                }
                
            })
            .catch(error => {
                console.error(error);
            });
        });
    }

    const mobileMenuBtn = document.querySelector('.menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileItems = document.querySelector('.mob-menu-items');
    mobileMenuBtn.addEventListener('click', () => {
        let isMobileMenuDisplayed = false;
        window.getComputedStyle(mobileMenu).width === '0px' ? isMobileMenuDisplayed = false : isMobileMenuDisplayed = true;

        if (!isMobileMenuDisplayed) {
            mobileItems.style.left = '50%';
            mobileMenu.style.left = '0';
            mobileMenu.style.width = '100%';

        } else {
            mobileMenu.style.width = '0';
            mobileItems.style.left = '-50px';
            mobileMenu.style.left = '-50px';
        }
    });
});