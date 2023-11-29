let slug, is_admin = false, board_admins, is_creator = false, isBackgroundSet = false, backgroundURL = null;

document.addEventListener('DOMContentLoaded', async () => {

    slug = document.getElementById('board-title').dataset.slug;
    const listBoard = document.querySelector('.list-board');
    let boardPrivacy = null;

    // Function to let the board title be edited.
    const boardTitle = document.querySelector('#board-title');
    boardTitle.addEventListener('click', (event) => {
        let currentTitle = boardTitle.innerText;
        boardTitle.setAttribute('contenteditable', 'true');
        boardTitle.spellcheck = false;
        boardTitle.focus();
        boardTitle.style.cursor = 'text';

        boardTitle.addEventListener('blur', () => {
            let newTitle = boardTitle.innerText;
            if (newTitle.trim().length === 0 || currentTitle === newTitle) {
                boardTitle.innerHTML = currentTitle;
                boardTitle.style.cursor = 'pointer';
            } else {
                fetch(`/board/${slug}/edit/`, {
                    method: "PUT",
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'title': newTitle
                    })    
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        boardTitle.removeAttribute('contenteditable');
                        boardTitle.cursor.style = 'pointer';
                        boardTitle.innerText = currentTitle;
                    }
                })
                .then(data => {
                    slug = data.slug;
                    boardTitle.removeAttribute('contenteditable');
                    boardTitle.style.cursor = 'pointer';
                    history.pushState('', '', `/render/${slug}`);
                })
            }
        }, {once: true})

        boardTitle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.target.blur();
            }
        })
    })


    const titleEditBtn = document.querySelector('#rename-board-btn');
    if (titleEditBtn != null) {
        titleEditBtn.addEventListener('click', () => {
            document.querySelector('#board-title').click();
            document.querySelector('#board-title').focus();
        });
    }
    
    // Renders the board when the render page is loaded.
    await fetch(`/board/${slug}/`, {
        method: 'GET',
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            const error = response.json();
            return error.then(errorData => {
                throw new Error('Request failed with status: ' + response.status);
            });
        }
    })
    .then(data => {
        console.log(data);
        is_admin = data.is_admin;
        is_creator = data.is_creator
        board_admins = data.admins;

        if(data.background_image != null) {
            isBackgroundSet = true;
            backgroundURL = data.background_image;
            const mainBoard = document.querySelector('.main');
            mainBoard
            mainBoard.style.backgroundImage = `url(/static/boards/images${backgroundURL})`;
        }

        if (data.lists.length > 0) {
            const boardList = data.lists;
            boardList.sort((a, b) => a.position - b.position);
            boardList.forEach(list => {
                const listCard = document.createElement('div');
                listCard.className = 'list-container py-1';
                listCard.setAttribute('draggable', 'true');
                listCard.dataset.id = list.id;
                const listTitleCont = document.createElement('div');
                listTitleCont.className = 'd-flex align-items-center justify-content-between py-1 gap-2';
                const listTitle = document.createElement('span');
                listTitle.className = 'list-title my-0'; 
                listTitle.innerText = list.title;
                const listMenu = document.createElement('div');
                listMenu.classList.add('btn-group');
                listMenu.innerHTML = `
                <div class="btn-group">
                    <button class="btn btn-sm card-settings" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu p-2">
                    <li class='pt-2'><div class="d-flex justify-content-between rename-list-btn" data-listid='${list.id}'><span>Rename List</span><i class="bi bi-pencil"></i></div></li>
                    <hr>
                    <li class='pb-2'><div class="d-flex justify-content-between list-delete-btn" data-listid='${list.id}'><span>Delete List</span><i class="bi bi-x"></i></div></li>
                    </ul>
                 </div>`;
                const listView = document.createElement('div');
                listView.className = 'd-flex flex-column list-view';
                const listCards = list.list_cards;
                listCards.sort((a, b ) => a.position - b.position);
                if (listCards.length > 0) {
                    listCards.forEach(card => {
                        const cardCont = document.createElement('div');
                        cardCont.className = 'card-container d-flex flex-column';
                        cardCont.dataset.id = card.id;
                        listView.appendChild(cardCont);
                        const labelCont = document.createElement('div');
                        labelCont.className = 'card-label-container mb-2';
                        cardCont.appendChild(labelCont);
                        if (card.labels.length > 0) {
                            card.labels.forEach(label => {
                                const labelSpan = document.createElement('span');
                                labelSpan.classList = 'label-badge badge rounded-pill w-25';
                                labelSpan.dataset.labelid = label.id;
                                labelSpan.style.backgroundColor = label.color;
                                labelSpan.innerHTML = `<span style='filter: contrast(1.5);'>${label.title}</span>`;
                                labelCont.appendChild(labelSpan);
                            })  
                        }
                        const cardTitle = document.createElement('span');
                        cardTitle.className = 'card-title';
                        cardTitle.innerText = card.title;
                        cardCont.appendChild(cardTitle);
                        cardCont.setAttribute('draggable', true);
                        const titleDesc = document.createElement('span');
                        titleDesc.className = 'small desc-status fw-bold';
                        cardCont.appendChild(titleDesc);
                        if (card.description) {
                            titleDesc.innerHTML += '<i class="bi bi-card-text me-2"></i>';
                        }
                        if (card.due != null) {
                            titleDesc.innerHTML += '<i class="bi bi-stopwatch me-2"></i>';
                        }
                        getEditCard(cardCont);                
                    });
                }
                const addCardBtn = document.createElement('div');
                addCardBtn.classList.add('add-card-container');
                addCardBtn.dataset.listid = list.id;
                addCardBtn.innerHTML = '<button class="add-card-btn"><span class="add-card-span"><i class="bi bi-file-earmark-plus me-2"></i> Add a card</span></button>';
                listCard.appendChild(listTitleCont);
                listTitleCont.appendChild(listTitle);
                listTitleCont.appendChild(listMenu);
                listCard.appendChild(listView);
                listCard.appendChild(addCardBtn);
                listBoard.appendChild(listCard);
                const listArchiveBtn = listMenu.querySelector('.list-delete-btn');
                listBoard.addEventListener('click', (event) => {
                    if (listArchiveBtn.contains(event.target)) {
                        archiveOrDeleteElement(listArchiveBtn);
                    }
                });
                const renameListBtn = listMenu.querySelector('.rename-list-btn');
                renameListBtn.addEventListener('click', () => {
                    listTitle.click();
                    listTitle.focus();
                });
            });
        }
        boardPrivacy = data.visibility;
    });

    const deleteCont = document.createElement('div');
    deleteCont.setAttribute('id', 'delete-div');
    const deleteContent = document.createElement('div');
    deleteContent.setAttribute('id', 'delete-container');
    deleteContent.classList.add('d-flex', 'flex-column', 'gap-3');
    deleteCont.appendChild(deleteContent);
    document.body.append(deleteCont);

    const addListCont = document.createElement('div');
    addListCont.setAttribute('id', 'first-list-container');
    addListCont.className = 'fixed-height g-0';
    addListCont.innerHTML = '<button class="add-list-btn"><span class="add-list-span"><i class="bi bi-card-list me-2"></i> Add a list</span></button>';
    listBoard.appendChild(addListCont);

    // Change Visibility Function

    const privacyDiv = document.createElement('div');
    privacyDiv.classList.add('privacy-div');
    privacyDiv.innerHTML = `
    <div class="container-fluid privacy-container flex-column flex-column justify-content-center align-items-center border border-secondary-subtle gap-3">
    <h5 class="text-center">Change the Privacy of the Board</h5>
        <div class="form-div d-flex flex-column justify-content-center align-items-center">
            <div class="form-check row d-flex flex-row border border-secondary-subtle rounded mx-3 py-1">
                <div class="col-1 d-flex justify-content-end align-items-center"><input class="form-check-input" type="radio" name="boardprivacy" id="publicboard"></div>
                <div class="col-10 d-flex flex-column">
                    <span><strong>Public Board</strong></span>
                    <span>Visible to all registered members of the site. Non-board members cannot edit the board.</span>
                </div>
                <div class="col-1"></div>
            </div>
            <div class="form-check row d-flex flex-row border border-secondary-subtle rounded mx-3 py-1">
                <div class="col-1 d-flex justify-content-end align-items-center"><input class="form-check-input" type="radio" name="boardprivacy" id="privateboard"></div>
                <div class="col-10 d-flex flex-column">
                    <span><strong>Private Board</strong></span>
                    <span>Visibile only to the members invited into the board. Default privacy of boards.</span>
                </div>
                <div class="col-1"></div>
            </div>
        <button class="btn btn-primary" id="submit-privacy">Set Privacy</button>
        </div>
    </div>
    `;

    document.body.append(privacyDiv);
    const visibilityBtn = document.getElementById('privacy-btn');
    const submitPrivacyBtn = privacyDiv.querySelector('#submit-privacy');

    if (visibilityBtn !=null) {
        visibilityBtn.addEventListener('click', () => {

            let isPrivacyDivDisplayed = false;
            window.getComputedStyle(privacyDiv).display === 'none' ? isPrivacyDivDisplayed = false : isPrivacyDivDisplayed = true;

            if (isPrivacyDivDisplayed) {
                privacyDiv.style.display = 'none';
                submitPrivacyBtn.removeEventListener('click', submitPrivacy);
                
            } else {
                if(boardPrivacy === 'Public') {
                    privacyDiv.querySelector('#publicboard').checked = true;
                } else {
                    privacyDiv.querySelector('#privateboard').checked = true;
                }
                privacyDiv.style.display = 'grid';
                const privacyCont = privacyDiv.querySelector('.privacy-container');
                privacyDiv.addEventListener('click', (event) => {
                    if (!privacyCont.contains(event.target)) {
                        privacyDiv.style.display = 'none';
                    }
                });
            }
        });
    }
    
    if (submitPrivacyBtn != null) {
        submitPrivacyBtn.addEventListener('click', () => {
            const privacyCont = document.querySelector('.privacy-container');
            if (privacyCont) {
                let visibility;
                const publicboard = privacyCont.querySelector('#publicboard');
                const privateboard = privacyCont.querySelector('#privateboard');
    
                if (publicboard.checked) {
                    visibility = 'Public';
                } else if (privateboard.checked) {
                    visibility = 'Private';
                }
    
                fetch(`/board/${slug}/edit/`, {
                    method: 'PUT',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'visibility': visibility
                    })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    else {
                        const error = response.json();
                        return error.then(errorData => {
                            throw new Error(errorData.detail);
                        });
                    }
                })
                .then(data => {
                    privacyCont.innerHTML = `
                    <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status"></div>
                    <span>Changing board privacy...</span>`;
                    setTimeout(() => {
                        window.location.href = `/render/${slug}`;
                    }, 2000)
                })
            }      
        });
    }
    
    // Add Background Image to the Board
    const backgroundBtn = document.querySelector('.background-button')
    const backgroundDiv = document.createElement('div');
    backgroundDiv.classList.add('background-div');
    let backgroundThumbnailHTML;
    if (isBackgroundSet) {
        backgroundThumbnailHTML = `<img src="/static/boards/images${backgroundURL}" alt="..." class="img-thumbnail default-image"></img><center><a class='remove-background-button text-danger'><small>Remove Background</small></a></center>`;
    } else {
        backgroundThumbnailHTML = `<img src="/static/boards/images/thumbnail.png" alt="..." class="img-thumbnail default-image"></img>`;
    }
    backgroundDiv.innerHTML = `
    <div class="container-fluid background-container flex-column flex-column justify-content-center align-items-center border border-secondary-subtle gap-2">
    <h5 class="text-center">Change the Background Image of the Board</h5>
        <div class="form-div d-flex flex-column justify-content-center align-items-center gap-2">
            <div class="input-group row d-flex justify-content-center">
                <div class='col-4'>${backgroundThumbnailHTML}
                </div>
                <div class='col-7 d-flex align-items-center'>
                <form class="background-form w-auto">
                <input type="file" class="form-control" id="background-image">
                </form>
                </div>
                <div class="col-10 d-flex justify-content-center"><span class='background-status mt-2'><small>You can only upload JPEG/PNG images not exceeding 5MB.</small></span></div>
            </div>
        <button class="btn btn-primary" id="submit-background">Set Background Image</button>
        </div>
    </div>
    `;
    document.body.append(backgroundDiv);
    let isBackgroundDivDisplayed = false;
    window.getComputedStyle(backgroundDiv).display === 'none' ? isBackgroundDivDisplayed = false : isBackgroundDivDisplayed = true;

    if (backgroundBtn != null) {
        backgroundBtn.addEventListener('click', () => {
            if (isBackgroundDivDisplayed) {
                backgroundDiv.style.display = 'none';
            } else {
                backgroundDiv.style.display = 'grid';
                
                const backgroundContainer = backgroundDiv.querySelector('.background-container');
                backgroundDiv.addEventListener('click', (event) => {
                    if (!backgroundContainer.contains(event.target)) {
                        backgroundDiv.style.display = 'none';
                    }
                });

                const backgroundSubmitBtn = backgroundContainer.querySelector('#submit-background');
                backgroundSubmitBtn.addEventListener('click', () => {
                    const backgroundForm = backgroundContainer.querySelector('.background-form');
                    backgroundForm.addEventListener('submit', (e) => {
                        e.preventDefault;
                    })
                    const backgroundData = new FormData();
                    const backgroundInput = backgroundContainer.querySelector('#background-image');
                    backgroundData.append('background-image', backgroundInput.files[0]);
                    fetch(`/board/${slug}/edit/change-background/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                        },
                        body: backgroundData
                    })
                    .then(response => {
                        if (response.ok) {
                            location.reload();
                        } else {
                            return response.json()
                            .then(data => {
                                const backgroundStatus = backgroundContainer.querySelector('.background-status');
                                backgroundStatus.innerHTML = `<small class='text-danger'>${data.detail}</small>`;
                            })
                        }
                    })
                })
            }
        })
    }

    const removeBackgroundBtn = document.querySelector('.remove-background-button');
    if (removeBackgroundBtn != null) {
        removeBackgroundBtn.addEventListener('click', () => {
            fetch(`/board/${slug}/edit/change-background/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                }
            })
            .then(response => {
                if (response.ok) {
                    location.reload();
                }
            })
        })
    }

    // Shows the invite div which contains the form that let's a member invite someone into the board. Only registered members can be invited at the moment.

    const inviteBtn = document.querySelector('.invite-button');
    const newInviteDiv = document.createElement('div');
    newInviteDiv.className = 'invite-div';
    newInviteDiv.innerHTML = `
    <div class="container-fluid invite-container flex-column flex-column justify-content-evenly align-items-center border border-secondary-subtle py-3">
        <div class="form-div invite-form row d-flex flex-lg-row flex-column justify-content-center align-items-center gap-0">
            <center><h3>Invite Members to the Board</h3></center>
            <div class="col-9 d-flex flex-row gap-2"><input class="form-control" type="text" name="email" id="email" placeholder="Email Address" required autocomplete="true"><button class="btn btn-primary" id="submit-invite">Invite</button></div>
            <div class="container-fluid status-div d-flex justify-content-center py-2">
            <span id="status-span"></span>
            </div>
        </div>
        <div class='container-fluid d-flex flex-column justify-content-start'><h5 class='py-0'>Board Members</h5></div>
        <div class="container-fluid board-members-invite-div d-flex flex-column justify-content-start px-3"></div>
        <span><small>Members with <i class="bi bi-star-fill" style='color: #D9DF14;'></i> beside their email addresses are board administrators.</small></span>
    </div>
    `;

    document.body.append(newInviteDiv);
    let isInviteDivDisplayed = false;
    window.getComputedStyle(newInviteDiv).display === 'none' ? isInviteDivDisplayed = false : isInviteDivDisplayed = true;

    if (inviteBtn != null) {
        inviteBtn.addEventListener('click', () => {
            if (isInviteDivDisplayed) {
                newInviteDiv.style.display = 'none';
            } else {
                newInviteDiv.style.display = 'grid';
                newInviteDiv.querySelector('#email').value = '';
                newInviteDiv.querySelector('#status-span').innerText = '';
                getBoardMembers()
                
                const newinviteContainer = newInviteDiv.querySelector('.invite-container');
                newInviteDiv.addEventListener('click', (event) => {
                    if (!newinviteContainer.contains(event.target)) {
                        newInviteDiv.style.display = 'none';
                    }
                });
            }
        })
    }

    const submitInviteBtn = document.querySelector('#submit-invite');
    if (submitInviteBtn != null) {
        submitInviteBtn.addEventListener('click', () => {
        const inviteDiv = document.querySelector('.invite-container');
        const email = inviteDiv.querySelector('#email').value;
        const status = inviteDiv.querySelector('#status-span');
            fetch(`/board/${slug}/members/invite/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'email': email
                })
            })
            .then(response => {
                return response.json().then(data => {
                    data.status = response.status;
                    return data;
                })
            })
            .then(data => {
                if (data.status === 202) {
                    status.className = 'text-success';
                    getBoardMembers();
                } else {
                    status.className = 'text-danger'; 
                }
                status.innerText = data.detail
            })
        })
    }
    
    
    // Add archive button and show a confirmation message before archiving.
    const deleteBtn = document.querySelector('.board-archive-button');
    if (deleteBtn != null) {
        document.body.addEventListener('click', (event) => {
            if (deleteBtn.contains(event.target)) {
                archiveOrDeleteElement(deleteBtn);
            }
        });
    }
    
    // Add archive button and show a confirmation message before archiving.
    const unArchiveBtn = document.querySelector('.board-unarchive-button');
    if (unArchiveBtn != null) {
        document.body.addEventListener('click', (event) => {
            if (unArchiveBtn.contains(event.target)) {
                archiveOrDeleteElement(unArchiveBtn);
            }
        });
    }
    
    // Attach the list title editor with modular function
    const listTitles = document.querySelectorAll('.list-title');
    listTitles.forEach(title => {
        attachListNameEditor(title);
    })

    // New Add List Function 
    if (addListCont != null) {
        const listFormHTML = ` 
        <form class="add-list-form" id="add-list-form">
            <div><label for="list-title">Title:</label>
            <input class="form-control" id="list-title" name="list-title" type="text" required></div>
            <span class="add-list-status"></span>
        </form>
        <div><button class="btn btn-sm btn-primary mb-1 ms-1" id="submit-list-btn">Create List</button></div>
        `;

        
        addListCont.addEventListener('click', (event) => {
            const addListBtn = document.querySelector('.add-list-btn');
            if (addListCont.contains(addListBtn) && addListBtn.contains(event.target)) {
                event.stopPropagation();
                addListCont.innerHTML = listFormHTML;
                addListCont.querySelector('#list-title').focus();

                const submitListBtn = addListCont.querySelector('#submit-list-btn');
                const formToStop = addListCont.querySelector('.add-list-form');
                formToStop.addEventListener('submit', (event) => {
                    event.preventDefault();
                })

                submitListBtn.addEventListener('click', () => {
                    const listTitle = document.querySelector('#list-title').value;
                    fetch(`/board/${slug}/lists/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'title': listTitle
                        })
                    })
                    .then(response => {
                        if (response.status == 201){
                            return response.json();
                        } else {
                            const error = response.json();
                            return error.then(errorData => {
                                throw new Error('Request failed with status: ' + response.status);
                            });
                        }
                    })
                    .then(data => {
                        addListCont.classList.replace('free-height', 'fixed-height');
                        addListCont.innerHTML = `<button class="add-list-btn"><span class="add-list-span"><i class="bi bi-card-list me-2"></i> Add a list</span></button>`;
                        const newList = document.createElement('div');
                        newList.className = 'list-container py-1';
                        newList.setAttribute('draggable', 'true');
                        newList.dataset.id = data.id;
                        newList.innerHTML = `
                            <div class="sticky-top py-1">
                                <span class="list-title my-0">${data.title}</span>
                            </div>
                            <div class="d-flex flex-column list-view">
                            </div>
                            <div class="add-card-container" data-listid="${data.id}">
                                <button class="add-card-btn"><span class="add-card-span"><i class="bi bi-file-earmark-plus me-2"></i> Add a card</span></button>
                            </div>`;
                        const listBoard = document.querySelector('.list-board');
                        const newListTitle = newList.querySelector('.list-title');
                        attachListNameEditor(newListTitle);
                        listBoard.appendChild(newList);
                        listBoard.removeChild(addListCont);
                        listBoard.appendChild(addListCont);
                        attachAddCardListeners(newList);
                    })
                    .catch(error => {
                        console.error(error);
                    });
                }) 

                document.body.addEventListener('click', function checkAddList(event) {
                    if (!addListCont.contains(event.target)) {
                        addListCont.innerHTML = `<button class="add-list-btn"><span class="add-list-span"><i class="bi bi-card-list me-2"></i> Add a list</span></button>`;
                        document.body.removeEventListener('click', checkAddList);
                    }
                })
            }
        })
    }

    // Get lists on the first load and attaches their respective add card listeners.

    const listContainers = document.querySelectorAll('.list-container');
    if (listContainers != null) {
        listContainers.forEach(container => {
            attachAddCardListeners(container);
        });
    }

    const leaveBoardBtn = document.querySelector('.leave-board-btn');
    if (leaveBoardBtn != null) {
        leaveBoardBtn.addEventListener('click', () => {
            archiveOrDeleteElement(leaveBoardBtn);
        })
    }

});

// Function that adds event listeners to list titles. When a title is clicked, it becomes an editable content.
function attachListNameEditor(titleElement) {
    titleElement.spellcheck = false;
    titleElement.addEventListener('click', (event) => {
        let currentTitle = event.target.innerText;
        const listCont = event.target.parentElement;
        const listID = listCont.parentElement.dataset.id;
        listCont.style.cursor = 'text';
        event.target.setAttribute('contenteditable', 'true');
        event.target.focus();

        event.target.addEventListener('blur', () => {
            const newTitle = event.target.innerText;
            listCont.style.cursor = 'pointer';
            titleElement.setAttribute('contenteditable', 'false');
            if (currentTitle != newTitle) {
                submitListTitleChange(slug, listID, titleElement, currentTitle, newTitle);
            } 
        }, {once: true});

        event.target.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.target.blur();
            }
        });
    })
}

// Function to close other add card forms - only 1 is allowed to be opened at a time.

function closeOtherForms(event) {
    const addCardBtnHTML = `<button class="add-card-btn"><span class="add-card-span"><i class="bi bi-file-earmark-plus me-2"></i> Add a card</span></button>`;
    const listContainers = document.querySelectorAll('.list-container');
    if (listContainers != null) {
        listContainers.forEach(container => {
            const addCardContainer = container.querySelector('.add-card-container');
            if(!container.contains(event.target) && container.classList.contains('active-list')) {
                addCardContainer.innerHTML = addCardBtnHTML;
                container.classList.remove('active-list');
            }
        });
    }
}

// Function that attaches click event listeners to add card buttons. When clicked, it adds an add card form to a list.

function attachAddCardListeners(listcontainer) {

    const addCardHTML =  `<div class="d-flex flex-column gap-1">
    <form class="add-card-form" id="add-card-form">
        <div>
            <input class="form-control focus-ring" id="card-title" name="card-title" type="text" placeholder="Enter card title" required>
        </div>
    </form>
    <div class="card-submit"><button class="btn btn-sm btn-primary mb-1" id="submit-card-btn">Add Card</button></div>
    </div>`;
    const AddCardBtnHTML = '<button class="add-card-btn"><span class="add-card-span"><i class="bi bi-file-earmark-plus me-2"></i> Add a card</span></button>';

    const listView = listcontainer.querySelector('.list-view');
    const addCardContainer = listcontainer.querySelector('.add-card-container');
    const listID = addCardContainer.dataset.listid;
    addCardContainer.addEventListener('click', (event) => {
        event.stopPropagation();
        const addCardBtn = addCardContainer.querySelector('.add-card-btn');
        closeOtherForms(event);

        let addForm = addCardContainer.querySelector('.add-card-form');
        if (addCardContainer.contains(event.target) && !addCardContainer.contains(addForm)) {
            addCardContainer.innerHTML = addCardHTML;
            listcontainer.classList.add('active-list');

            addForm = addCardContainer.querySelector('.add-card-form');

            addForm.addEventListener('submit', (event) => {
                event.preventDefault();
            });

            document.body.addEventListener('click', function addCardFormChecker(event) {
                if (!addCardContainer.contains(event.target)) {
                    addCardContainer.innerHTML = AddCardBtnHTML;
                    document.body.removeEventListener('click', addCardFormChecker);
                }
            })

            listView.scrollTop = listView.scrollHeight;
            const titleInput = addCardContainer.querySelector('#card-title');
            titleInput.focus();

            const submitCardBtn = addCardContainer.querySelector('#submit-card-btn');
            if (submitCardBtn != null) {
                submitCardBtn.addEventListener('click', () => {
                    fetch(`/board/${slug}/list/${listID}/cards/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'title': titleInput.value
                        })
                    })
                    .then(response => {
                        if (response.status == '201') {
                            return response.json();
                        } else {
                            const error = response.json();
                            return error.then(errorData => {
                                throw new Error('Request failed with status: ' + response.status);
                            });
                        }
                    })
                    .then(data => {
                        const newCard = document.createElement('div');
                        newCard.className = 'card-container d-flex flex-column';
                        newCard.innerHTML = `<span class="card-title">${data.title}</span>`;
                        newCard.dataset.id = data.id;
                        getEditCard(newCard);
                        listView.appendChild(newCard);
                        newCard.setAttribute('draggable', 'true');
                        addCardContainer.innerHTML = AddCardBtnHTML;
                    })
                })
            }
        }
    });
}

// Function that shows the details of a card when clicked.

function showCard(event) {
    let card = event.target;
    if (!event.target.classList.contains('card-container')) {
        let elementParent = event.target.parentElement;
        if (!elementParent.classList.contains('card-container')) {
            elementParent = elementParent.parentElement;
            card = elementParent;
        } else {
            card = elementParent;
        }
    }

    const listView = card.parentElement;
    const listID = listView.parentElement.dataset.id;
    const cardID = card.dataset.id;
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-div';
    const cardMenu = document.createElement('div');
    cardMenu.className = 'card-menu';
    let cardHTML = `
    <div class='card-content p-3'>
        <div class='card-content-title row pb-1'>    
            <div class='col-1 column-start'><i class="bi bi-files-alt card-title-bi"></i></div>
            <div class='col-lg-9 col-md-9 col-11 d-flex flex-column card-title-slot'></div>
            <div class='col-lg-2 col-md-2 col-0'></div>
        </div>
        <div class='card-content-manage row py-3'>  
            <div class='row'>
                <div class='col-1 column-start'><i class="bi bi-gear-fill"></i></div>
                <div class='col-lg-9 col-md-9 col-11'><span class='fw-bold'>Manage Card</span></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
            <div class='row pt-2'>
                <div class='col-1 column-start'></div>
                <div class='col-lg-9 col-md-9 col-11  card-manage-slot'>
                    <button class="btn btn-warning btn-sm" id='change-title-btn'>Change Title</button>
                    <button class="btn btn-danger btn-sm" id='delete-card-btn' data-cardid='${cardID}' data-listid='${listID}'>Delete</button>
                </div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>  
        </div>
        <div class='card-content-labels row py-3'>  
            <div class='row'>
                <div class='col-1 column-start'><i class="bi bi-tags"></i></div>
                <div class='col-lg-9 col-md-9 col-11'><span class='fw-bold'>Labels</span></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
            <div class='row'>
                <div class='col-1 column-start'></div>
                <div class='col-lg-9 col-md-9 col-11 card-labels-slot'></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>  
        </div>
        <div class='card-content-description row py-3'>    
            <div class='row'>
                <div class='col-1 column-start'><i class="bi bi-card-text"></i></div>
                <div class='col-lg-9 col-md-9 col-11'><span class='fw-bold'>Description</span></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
            <div class='row'>
                <div class='col-1 column-start'></div>
                <div class='col-lg-9 col-md-9 col-11 card-description-slot'></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
        </div>
        <div class='card-content-date row py-3 mt-3'>    
            <div class='row'>
                <div class='col-1 column-start'><i class="bi bi-calendar3"></i></div>
                <div class='col-lg-9 col-md-9 col-11'><span class='fw-bold'>Due Date</span></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
            <div class='row'>
                <div class='col-1 column-start'></div>
                <div class='col-lg-9 col-md-9 col-11 card-date-slot my-1'></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
        </div>
        <div class='cand-content-activity row py-3 mt-3'>
            <div class='row pb-1'>
                <div class='col-1 column-start'><i class="bi bi-card-text"></i></div>
                <div class='col-lg-9 col-md-9 col-11'><span class='fw-bold'>Activity</span></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
            <div class='row'>
                <div class='col-1 column-start'></div>
                <div class='col-lg-9 col-md-9 col-11 card-activity-slot d-flex flex-column'></div>
                <div class='col-lg-2 col-md-2 col-0'></div>
            </div>
        </div>
    </div>`;
    fetch(`/board/${slug}/list/${listID}/card/${cardID}/`, {
        'method': 'GET',
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            const error = response.json();
            return error.then(errorData => {
                throw new Error(errorData.detail);
            });
        }
    })
    .then(data => {
        cardMenu.innerHTML = cardHTML;
        cardMenu.addEventListener('click', (event) => {
            const deleteCardBtn = cardMenu.querySelector('#delete-card-btn');
            if (deleteCardBtn.contains(event.target)) {
                archiveOrDeleteElement(deleteCardBtn, card);
            }

            const changeTitleBtn = cardMenu.querySelector('#change-title-btn');
            const changeTitleToEdit = cardMenu.querySelector('.card-title-slot');
            if (changeTitleBtn.contains(event.target)) {
                changeTitleToEdit.click();
            }
        });

        if (data.title != null) {
            let currentTitle = data.title;
            const cardTitleSlot = cardMenu.querySelector('.card-title-slot');
            const titleCont = document.createElement('h2');
            titleCont.innerText = currentTitle;
            cardTitleSlot.append(titleCont);
            cardTitleSlot.addEventListener('click', (event) => {
                event.stopPropagation();
                if (cardTitleSlot.contains(event.target)) {
                    titleCont.setAttribute('contenteditable', 'true');
                    titleCont.spellcheck = false;
                    titleCont.focus();
                    titleCont.addEventListener('blur', () => {
                        const newTitle = titleCont.innerText;
                        event.target.setAttribute('contenteditable', 'false');
                        if (newTitle.length >= 1 && newTitle != currentTitle) {
                            fetch(`/board/${slug}/list/${listID}/card/${data.id}/`, {
                                method: 'PUT',
                                headers: {
                                    'X-CSRFToken' : csrfToken,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    'title': newTitle
                                })
                            })
                            .then(response => {
                                if (response.ok) {
                                    currentTitle = newTitle
                                    card.querySelector('.card-title').innerText = currentTitle;
                                    getCardUpdates(listID, cardID);
                                    return response.json();
                                }
                                else {
                                    titleCont.innerText = currentTitle;
                                    const error = response.json();
                                    return error.then(errorData => {
                                        throw new Error(errorData.detail);
                                    });
                                }
                            })
                        } else {
                            titleCont.innerText = currentTitle;
                        }
                    }, {once: true});
                    
                    titleCont.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            event.target.setAttribute('contenteditable', 'false');
                            event.target.blur();
                        }
                    })
                }


            })
        }
        
        const cardDescription = cardMenu.querySelector('.card-description-slot');
        cardDescription.spellcheck = false;
        let currentDescription = '';
        if (!data.description || data.description.trim().length === 0) {
            cardDescription.innerHTML = '<span class="description-span"><em class="desc-placeholder">Click here to add a description</em></span>';
        } else {
            currentDescription = data.description;
            cardDescription.innerHTML = `<span class="description-span">${currentDescription}</span>`;             
        }

        cardDescription.addEventListener('click', (event) => {
            const descriptionSpan = cardDescription.querySelector('.description-span');
            if (descriptionSpan != null) {
                event.stopPropagation();
                if ((!data.description || data.description.trim().length === 0) && currentDescription.trim().length === 0) {
                    cardDescription.innerHTML = `
                    <div contenteditable="true" id="edit-description-content" class="form-control" style="height: 100%;"></div>
                    <button class="btn btn-primary btn-sm my-1" id="submit-description">Submit</button>
                    `;
                    cardDescription.querySelector('#edit-description-content').focus();
                } else {
                    cardDescription.innerHTML = `
                    <div contenteditable="true" id="edit-description-content" class="form-control" style="height: 100%;">${currentDescription}</div>
                    <button class="btn btn-primary btn-sm my-1" id="submit-description">Submit</button>
                    `;
                    cardDescription.querySelector('#edit-description-content').focus();
                }
                
                cardMenu.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const descriptionTextarea = cardDescription.querySelector('#edit-description-content');
                    if (descriptionTextarea != null && !cardDescription.contains(event.target)) {
                        if (!data.description || data.description.trim().length === 0) {
                            cardDescription.innerHTML = '<span class="description-span"><em>Click here to add a description</em></span>';
                        } else {
                            cardDescription.innerHTML = `<span class="description-span">${currentDescription}</span>`;
                        }
                    }
                });

                const submitDescriptionEdit = cardDescription.querySelector('#submit-description');
                if (submitDescriptionEdit != null) {
                    submitDescriptionEdit.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const cardNewDesc = cardDescription.querySelector('#edit-description-content').innerText;
                        fetch(`/board/${slug}/list/${listID}/card/${data.id}/`, {
                            method: 'PUT',
                            headers: {
                                'X-CSRFToken': csrfToken,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                'description': cardNewDesc
                            })
                        })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            }
                            else {
                                const error = response.json();
                                return error.then(errorData => {
                                    throw new Error(errorData.detail);
                                });
                            }
                        })
                        .then(data => {
                            currentDescription = data.description
                            const cardDescStatus = card.querySelector('.desc-status');
                            const cardCont = document.querySelector(`.card-container[data-id="${cardID}"]`);
                            const statusCont = cardCont.querySelector('.desc-status');
                            const dueStatus = statusCont.querySelector('.bi-card-text');
                            if (currentDescription.trim().length === 0){
                                if (dueStatus) {
                                    dueStatus.remove();
                                }
                                cardDescription.innerHTML = '<span class="description-span"><em>Click here to add a description</em></span>';
                            }
                            else {
                                cardDescription.innerHTML = `<span class="description-span">${currentDescription}</span>`;
                                if (!dueStatus) {
                                    statusCont.insertAdjacentHTML('afterbegin', '<i class="bi bi-card-text me-2"></i>');
                                }
                                getCardUpdates(listID, cardID);
                            }                                 
                        })
                        .catch(error => {
                            console.error(error.message);
                        });
                    });
                }
            }    
        });

        if (data.labels.length > 0) {
            const cardLabels = data.labels;
            cardLabels.forEach(label => {
                if (!label.title) {
                    label.title = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
                }
                const labelBtn = document.createElement('button');
                labelBtn.classList.add('badge-button', 'me-1');
                labelBtn.innerHTML = `<span class='badge' style='background-color: ${label.color}' onmouseenter="addDeleteBtn(event)" onmouseleave="removeDeleteBtn(event)">${label.title}<i class="ms-2 bi bi-x-circle" id="delete-btn" onclick="deleteLabel(event)"></i></span>`;
                labelBtn.dataset.labelid = label.id;
                labelBtn.dataset.listid = listID;
                labelBtn.dataset.cardid = cardID;
                cardMenu.querySelector('.card-labels-slot').appendChild(labelBtn);
            });
        }
        cardMenu.querySelector('.card-labels-slot').innerHTML += '<div id="add-label-container" class="my-1"><button id="add-label-btn" class="add-label-btn"><i class="bi bi-plus-circle"><span class="ms-2">Add a label</span></i></button></div>';
        const addLabelCont = document.querySelector('#add-label-container');
        const addLabelHTML = `<div class="border border-secondary-subtle rounded p-2"><input class="form-control" id="label-title" name="label-title" type="text" placeholder="Enter a title for the label (Optional)">
        <div class="d-flex flex-row gap-2 my-1 align-items-center"><label for="label-color">Color:</label>
        <input type="color" class="form-control form-control-color" id="label-color" name="label-color" value="#ffffb5" required></div>
        <div><button class="btn btn-sm btn-primary" id="submit-label-btn">Add Label</button></div></div>`;
        addLabelCont.addEventListener('click', (event) => {
            event.stopPropagation();
            const addLabelBtn = document.querySelector('#add-label-btn');
            if (addLabelCont.contains(event.target) && addLabelCont.contains(addLabelBtn)) {
                addLabelCont.innerHTML = addLabelHTML;
                const submitLabelBtn = addLabelCont.querySelector('#submit-label-btn');
                submitLabelBtn.addEventListener('click', () => {
                    const labeltitle = addLabelCont.querySelector('#label-title').value;
                    const labelcolor = addLabelCont.querySelector('#label-color').value;
                    let labeldetails = {};
                    if (labeltitle != null) {
                        labeldetails.title = labeltitle;
                    }
                    if (labelcolor != null) {
                        labeldetails.color = labelcolor;
                    }
                    
                    fetch(`/board/${slug}/list/${listID}/card/${cardID}/labels/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(labeldetails)
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        else {
                            const error = response.json();
                            return error.then(errorData => {
                                throw new Error(errorData.detail);
                            });
                        }
                    })
                    .then(data => {
                        const buttons = addLabelCont.parentElement;
                        const newButton = document.createElement('button');
                        newButton.classList.add('badge-button', 'me-1');
                        newButton.dataset.labelid = data.id;
                        newButton.dataset.listid = listID;
                        newButton.dataset.cardid = cardID;
                        if (!data.title) {
                            data.title = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
                        }
                        newButton.innerHTML = `<span class='badge' style='background-color: ${data.color}' onmouseenter="addDeleteBtn(event)" onmouseleave="removeDeleteBtn(event)">${data.title}<i class="ms-2 bi bi-x-circle" id="delete-btn" onclick="deleteLabel(event)"></i></span>`;
                        buttons.appendChild(newButton);
                        buttons.removeChild(addLabelCont);
                        addLabelCont.innerHTML = '<button id="add-label-btn"><i class="bi bi-plus-circle"><span class="ms-2">Add a label</span></i></button>';
                        buttons.appendChild(addLabelCont);

                        const labelCont = card.querySelector('.card-label-container');
                        const labelSpan = document.createElement('span');
                        labelSpan.classList = 'label-badge badge rounded-pill w-25';
                        labelSpan.dataset.labelid = data.id;
                        labelSpan.style.backgroundColor = data.color;
                        labelSpan.innerHTML = `<span style='filter: contrast(1.5);'>${data.title}</span>`;
                        labelCont.appendChild(labelSpan);
                    })
                    .catch(error => {
                        console.error(error.message);
                    });
                })
            }

            cardMenu.addEventListener('click', (event) => {
                if(cardMenu.contains(event.target) && (addLabelCont != null)) {
                    addLabelCont.innerHTML = '<button id="add-label-btn"><i class="bi bi-plus-circle"><span class="ms-2">Add a label</span></i></button>';
                }
            });
        })

        if (!data.due) {
            const dateCont = cardMenu.querySelector('.card-date-slot');
            dateCont.innerHTML = '<button id="add-due-btn"><i class="bi bi-calendar-plus"><span class="ms-2">Add a due date</span></i></button>';
            addSubmitDueBtn(slug, listID, data.id, cardMenu, dateCont);
        }
        else {
            const dateCont = cardMenu.querySelector('.card-date-slot');
            const dataDue = new Date(data.due);
            dateCont.innerHTML = `
            <div class="row">
                <div class='col-lg-7 col-md-7 col-12'><span class='badge text-bg-warning'>${dataDue.toLocaleString()}</span></div>
            </div>
            <div class="row">
                <div class='col-6 d-flex flex-row gap-1'><button class="btn btn-success btn-sm" id="edit-due-btn">Edit</button><button class="btn btn-danger btn-sm" id="remove-due-btn">Remove</button></div>
            </div>`;
            addEditRemoveDueBtn(slug, listID, data.id, data.due, cardMenu, dateCont);
        }

        if (data.updates) {
            updateData = data.updates.reverse();
            const updateDiv = document.querySelector('.card-activity-slot');
            updateData.forEach(update => {
                const updateDetails = document.createElement('span');
                updateDetails.classList.add('py-1');
                updateDetails.innerHTML = `<i class="bi bi-info-circle fw-bold"></i> ${update.detail}`;
                updateDiv.appendChild(updateDetails);
            });
        }
    })
    .catch(error => {
        console.error(error.message);
    });

    cardDiv.appendChild(cardMenu);
    document.body.appendChild(cardDiv);

    cardMenu.addEventListener('click', (event) => {
        const addLabelCont = document.querySelector('#add-label-container');
        if(cardMenu.contains(event.target) && (addLabelCont != null) && !addLabelCont.contains(event.target)) {
            addLabelCont.innerHTML = '<button id="add-label-btn"><i class="bi bi-plus-circle"><span class="ms-2">Add a label</span></i></button>';
        }
    })

    cardDiv.addEventListener('click', (event) => {
        if (!cardMenu.contains(event.target)) {
            cardDiv.remove();
        }
    })
    
}


// Function that opens a card menu that lets a member edit a card's description, title and other actions.

function getEditCard(cardElement) {
    const card = cardElement;
    card.addEventListener('click', (event) => showCard(event));
}   

// Function that shows the delete button for the labels when hovered on.

function addDeleteBtn(event) {
    event.target.querySelector('#delete-btn').style.display = 'inline';
    event.target.querySelector('#delete-btn').style.opacity = '1';
}

// Function that hides the delete button for the labels when hovered on.

function removeDeleteBtn(event) {
    event.target.querySelector('#delete-btn').style.display = 'none';
    event.target.querySelector('#delete-btn').style.opacity = '0';
}

// Once clicked, this function removes the label from the DOM and sends a request to the server to remove the label from the card.

function deleteLabel(event) {
    const labelspan = event.target.parentElement;
    const labelBtn = labelspan.parentElement;
    const labelID = labelspan.parentElement.dataset.labelid;
    const listID = labelspan.parentElement.dataset.listid;
    const cardID = labelspan.parentElement.dataset.cardid;
    fetch(`/board/${slug}/list/${listID}/card/${cardID}/label/${labelID}/delete/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            labelBtn.remove();

            const card = document.querySelector(`.card-container[data-id="${cardID}"]`)
            const labelCont = card.querySelector('.card-label-container');
            const label = labelCont.querySelector(`.label-badge[data-labelid="${labelID}"]`);
            label.remove();
            
        }
        else {
            const error = response.json();
            return error.then(errorData => {
                throw new Error(errorData.detail);
            });
        }
    })
    .catch(error => {
        console.error(error.message);
    });
}

function addSubmitDueBtn(slug, listID, cardID, cardMenu, dateCont) {
    const addDueHTML = `<div class="border border-secondary-subtle rounded px-2 py-1">
                <div class="d-flex flex-row gap-2 my-1 align-items-center"><label for="label-color">Pick your due date:</label>
                <input type="datetime-local" id="card-due" name="card-due"></div>
                <div class="py-1"><button class="btn btn-sm btn-primary" id="submit-due-btn">Add Due Date</button></div></div>`;

    dateCont.addEventListener('click', (event) => {
        const addDueBtn = cardMenu.querySelector('#add-due-btn');
        event.stopPropagation();
        if (addDueBtn && addDueBtn.contains(event.target)) {
            dateCont.innerHTML = addDueHTML;

            const dueSubmitBtn = dateCont.querySelector('#submit-due-btn');
            dueSubmitBtn.addEventListener('click', () => {
                const submittedDate = dateCont.querySelector('#card-due').value;
                if (submittedDate.trim().length != 0) {
                    fetch(`/board/${slug}/list/${listID}/card/${cardID}/`, {
                        method: 'PUT',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'due': submittedDate
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        else {
                            const error = response.json();
                            return error.then(errorData => {
                                throw new Error(errorData.detail);
                            });
                        }
                    })
                    .then(data => {
                        const dateCont = cardMenu.querySelector('.card-date-slot');
                        const dataDue = new Date(data.due);
                        dateCont.innerHTML = `
                        <div class="row">
                            <div class='col-7'><span class='badge text-bg-warning'>Due date: ${dataDue.toLocaleString()}</span></div>
                        </div>
                        <div class="row">
                            <div class='col-6 d-flex flex-row gap-1'><button class="btn btn-success btn-sm" id="edit-due-btn">Edit</button><button class="btn btn-danger btn-sm" id="remove-due-btn">Remove</button></div>
                        </div>`;
                        getCardUpdates(listID, cardID);
                        const cardCont = document.querySelector(`.card-container[data-id="${cardID}"]`);
                        const statusCont = cardCont.querySelector('.desc-status');
                        const dueStatus = statusCont.querySelector('.bi-stopwatch');
                        if (!dueStatus) {
                            statusCont.innerHTML += '<i class="bi bi-stopwatch me-2"></i>';
                        }
                        addEditRemoveDueBtn(slug, listID, cardID, data.due, cardMenu, dateCont);
                    })
                    .catch(error => {
                        console.error(error.message);
                    });
                }   
            })
        }
        
        cardMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            const dueForm = cardMenu.querySelector('#card-due');
            if (dueForm && !dateCont.contains(event.target)) {
                event.stopPropagation();
                dateCont.innerHTML = '<button id="add-due-btn"><i class="bi bi-calendar-plus me-2"><span class="ms-2">Add a due date</span></i></button>';
            }
        })
    })
}

function addEditRemoveDueBtn(slug, listID, cardID, currentDate, cardMenu, dateCont) {
    let chosenDate = new Date(currentDate).toISOString().replace('Z', '');
    dateCont.addEventListener('click', (event) => {
        const editDueBtn = dateCont.querySelector('#edit-due-btn');
        const removeDueBtn = dateCont.querySelector('#remove-due-btn');
        event.stopPropagation();
        if(editDueBtn && editDueBtn.contains(event.target)) {
            dateCont.innerHTML = `<div class="border border-secondary-subtle rounded px-2 py-1">
            <div class="d-flex flex-row gap-2 my-1 align-items-center"><label for="label-color" class="fw-bold">Pick your new date:</label>
            <input type="datetime-local" id="card-due" name="card-due" value="${chosenDate}"></div>
            <div class="py-1"><button class="btn btn-sm btn-success" id="submit-due-btn">Save Due Date</button></div></div>`;

            const dueSubmitBtn = dateCont.querySelector('#submit-due-btn');
            dueSubmitBtn.addEventListener('click', () => {
                const submittedDate = dateCont.querySelector('#card-due').value;
                if (submittedDate.trim().length != 0) {
                    fetch(`/board/${slug}/list/${listID}/card/${cardID}/`, {
                        method: 'PUT',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'due': submittedDate
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        else {
                            const error = response.json();
                            return error.then(errorData => {
                                throw new Error(errorData.detail);
                            });
                        }
                    })
                    .then(data => {
                        chosenDate = new Date(data.due).toISOString().replace('Z', '');
                        const dataDue = new Date(data.due);
                        dateCont.innerHTML = `    
                        <div class="row">
                            <div class='col-7'><span class='badge text-bg-warning'>Due date: ${dataDue.toLocaleString()}</span></div>
                        </div>
                        <div class="row">
                            <div class='col-6 d-flex flex-row gap-1'><button class="btn btn-success btn-sm" id="edit-due-btn">Edit</button><button class="btn btn-danger btn-sm" id="remove-due-btn">Remove</button></div>
                        </div>`;
                        getCardUpdates(listID, cardID);
                        const cardCont = document.querySelector(`.card-container[data-id="${cardID}"]`);
                        const statusCont = cardCont.querySelector('.desc-status');
                        const dueStatus = statusCont.querySelector('.bi-stopwatch');
                        if (!dueStatus) {
                            statusCont.innerHTML += '<i class="bi bi-stopwatch me-2"></i>';
                        }
                        addEditRemoveDueBtn(slug, listID, cardID, dataDue, cardMenu, dateCont);
                    })
                    .catch(error => {
                        console.error(error.message);
                    });
                }   
            })
        }

        if(removeDueBtn && removeDueBtn.contains(event.target)) {
            fetch(`/board/${slug}/list/${listID}/card/${cardID}/`, {
                method: 'PUT',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'due': null
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                else {
                    const error = response.json();
                    return error.then(errorData => {
                        throw new Error(errorData.detail);
                    });
                }
            })
            .then(data => {
                dateCont.innerHTML = '<button id="add-due-btn"><i class="bi bi-calendar-plus me-2"><span class="ms-2">Add a due date</span></i></button>';
                getCardUpdates(listID, cardID);
                const cardCont = document.querySelector(`.card-container[data-id="${cardID}"]`);
                const statusCont = cardCont.querySelector('.desc-status');
                const dueStatus = statusCont.querySelector('.bi-stopwatch');
                if (dueStatus) {
                    dueStatus.remove();
                }
                addSubmitDueBtn(slug, listID, cardID, cardMenu, dateCont);
            })
            .catch(error => {
                console.error(error.message);
            });
        }
        
        cardMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            if(!dateCont.contains(event.target)) {
                dateCont.innerHTML = `
                <div class="row">
                    <div class='col-7'><span class='badge text-bg-warning'>Due date: ${chosenDate}</span></div>
                </div>
                <div class="row">
                    <div class='col-6 d-flex flex-row gap-1'><button class="btn btn-success btn-sm" id="edit-due-btn">Edit</button><button class="btn btn-danger btn-sm" id="remove-due-btn">Remove</button></div>
                </div>`;
            }
        });
    });
}

function submitListTitleChange(slug, listID, titleElem, currentTitle, newTitle) {
    fetch(`/board/${slug}/list/${listID}/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({
            'title': newTitle
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            titleElem.innerText = currentTitle;
            const error = response.json();
            return error.then(errorData => {
                throw new Error(errorData.detail);
            });
        }
    })
    .catch(error => {
        console.error(error.message);
    });
}

function archiveOrDeleteElement(element, cardElement = null) {
    const deleteCont = document.querySelector('#delete-div');
    const deleteContent = document.querySelector('#delete-container')
    if (element.classList.contains('board-archive-button')) {
        deleteCont.style.display = 'grid';
        deleteCont.children[0].innerHTML = `
        <div class="row mt-3">
            <h1 class='display-4'><i class="bi bi-slash-circle"></i></h1>
        </div>
        <div class="row">
            <center>
                <h4>Are you sure that you want to archive this board?</h4>
            </center>
        </div>
        <div class="row d-flex justify-content-center">
            <div class='col-10'><span>Once you archive this board, only you, the board creator will be allowed to view what's inside this board. You can remove it from archive anytime.</span></div>
        </div>
        <div class="row d-flex flex-row gap-3 my-3">
            <div class="col-5"><button class="btn btn-danger btn-small" id="archive-board-btn">Archive</button></div>
            <div class="col-5"><button class="btn btn-warning btn-small" id="cancel-request">Cancel</button></div>
        </div>
        `;
        const archiveBtn = deleteCont.querySelector('#archive-board-btn');
        archiveBtn.addEventListener('click', () => {
            submitArchive(slug, element);
        });
    }

    if (element.classList.contains('board-unarchive-button')) {
        deleteCont.style.display = 'grid';
        deleteCont.children[0].innerHTML = `
        <div class="row mt-3">
            <h1 class='display-4'><i class="bi bi-slash-circle"></i></h1>
        </div>
        <div class="row">
            <center>
                <h4>Are you sure that you want to remove this board from archive?</h4>
            </center>
        </div>
        <div class="row d-flex justify-content-center">
            <div class='col-10'><span>Once you remove this board from archive, all board members (if private) or all website members (if public) will see its contents. You can archive it again anytime.</span></div>
        </div>
        <div class="row d-flex flex-row gap-3 my-3">
            <div class="col-5"><button class="btn btn-danger btn-small" id="unarchive-board-btn">Unarchive</button></div>
            <div class="col-5"><button class="btn btn-warning btn-small" id="cancel-request">Cancel</button></div>
        </div>
        `;
        const unarchiveBtn = deleteCont.querySelector('#unarchive-board-btn');
        unarchiveBtn.addEventListener('click', () => {
            submitArchive(slug, element);
        });
    }

    if (element.classList.contains('list-delete-btn')) {
        deleteCont.style.display = 'grid';
        deleteCont.children[0].innerHTML = `
        <div class="row mt-3">
            <h1 class='display-4'><i class="bi bi-slash-circle"></i></h1>
        </div>
        <div class="row">
            <center>
                <h4>Are you sure that you want to delete this list?</h4>
            </center>
        </div>
        <div class="row d-flex justify-content-center">
            <div class='col-12'><span>This action cannot be undone. The list will be deleted permanently.</span></div>
        </div>
        <div class="row d-flex flex-row gap-3 my-3">
            <div class="col-5"><button class="btn btn-danger btn-small" id="delete-list-btn">Delete</button></div>
            <div class="col-5"><button class="btn btn-warning btn-small" id="cancel-request">Cancel</button></div>
        </div>
        `;
        const listDeleteBtn = deleteCont.querySelector('#delete-list-btn');
        listDeleteBtn.addEventListener('click', () => {
            submitArchive(slug, element, element.dataset.listid);
        });
    }

    if (element.getAttribute('id') === 'delete-card-btn') {
        deleteCont.style.display = 'grid';
        deleteCont.children[0].innerHTML = `
        <div class="row mt-3">
            <h1 class='display-4'><i class="bi bi-slash-circle"></i></h1>
        </div>
        <div class="row">
            <center>
                <h4>Are you sure that you want to delete this card?</h4>
            </center>
        </div>
        <div class="row d-flex justify-content-center">
            <div class='col-12'><span>This action cannot be undone. The card will be deleted permanently.</span></div>
        </div>
        <div class="row d-flex flex-row gap-3 my-3">
            <div class="col-5"><button class="btn btn-danger btn-small" id="delete-card-confirm">Delete</button></div>
            <div class="col-5"><button class="btn btn-warning btn-small" id="cancel-request">Cancel</button></div>
        </div>
        `;
        const cardDeleteBtn = deleteCont.querySelector('#delete-card-confirm');
        cardDeleteBtn.addEventListener('click', () => {
            submitArchive(slug, element, element.dataset.listid, element.dataset.cardid, cardElement);
        });
    }

    if (element.classList.contains('leave-board-btn')) {
        deleteCont.style.display = 'grid';
        deleteCont.children[0].innerHTML = `
        <div class="row mt-3">
            <h1 class='display-4'><i class="bi bi-slash-circle"></i></h1>
        </div>
        <div class="row">
            <center>
                <h4>Are you sure that you want to leave this board?</h4>
            </center>
        </div>
        <div class="row d-flex justify-content-center">
            <div class='col-12'><span>If this board is set to private and you leave, you will not see any of its contents anymore.</span></div>
        </div>
        <div class="row d-flex flex-row gap-3 my-3">
            <div class="col-5"><button class="btn btn-danger btn-small" id="leave-board-confirm">Leave</button></div>
            <div class="col-5"><button class="btn btn-warning btn-small" id="cancel-request">Cancel</button></div>
        </div>
        `;
        const leaveConfirmBtn = deleteCont.querySelector('#leave-board-confirm');
        leaveConfirmBtn.addEventListener('click', () => {
            fetch(`/board/${slug}/members/${userID}/remove/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/user/dashboard/';
                }
            })
        });
    }

    const cancelRequestBtn = deleteCont.querySelector('#cancel-request');
    cancelRequestBtn.addEventListener('click', () => {
        deleteCont.style.display = 'none';
    });

    deleteCont.addEventListener('click', (event) => {
        if(!deleteContent.contains(event.target)) {
            deleteCont.style.display = 'none';
        }
    });
    
}

function submitArchive(slug, element, listID = null, cardID = null, cardElement = null) {
    const deleteDiv = document.querySelector('#delete-div');
    const deleteCont = document.querySelector('#delete-container');
    let archiveURL = '';
    if (listID === null && cardID === null) {
        archiveURL = `/board/${slug}/edit/`;
    }

    if(listID != null && cardID === null) {
        archiveURL = `/board/${slug}/list/${listID}/`
    }

    if(listID != null && cardID != null) {
        archiveURL = `/board/${slug}/list/${listID}/card/${cardID}/`
    }

    fetch(archiveURL, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (response.ok) {
            if (element.classList.contains('board-archive-button')) {
                deleteCont.innerHTML = `<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status"></div>
                <span>Archiving this board...</span>`;
                setTimeout(() => {
                    window.location.href = `/render/${slug}`;
                }, 1000)
            }

            if (element.classList.contains('board-unarchive-button')) {
                deleteCont.innerHTML = `<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status"></div>
                <span>Removing this board from archive...</span>`;
                setTimeout(() => {
                    window.location.href = `/render/${slug}`;
                }, 1000)
            }

            if (element.classList.contains('list-delete-btn')) {
                const listContainers = document.querySelectorAll('.list-container');
                for (const container of listContainers) {
                    if (container.dataset.id === element.dataset.listid){
                        container.remove();
                        deleteDiv.style.display = 'none';
                    }
                }
            }

            if (element.getAttribute('id') === 'delete-card-btn') {
                const cardDiv = document.querySelector('.card-div');
                cardElement.remove();
                deleteDiv.style.display = 'none';
                cardDiv.remove();
            }
        }
    })
    .catch(error => {
        console.error(error);
    })
}

function getBoardMembers() {
    fetch(`/board/${slug}/members/`, {
        method: 'GET'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
    })
    .then(data => {
        const members = data.members;
        const memberContainer = document.querySelector('.board-members-invite-div');
        memberContainer.innerHTML = '';
        members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('row', 'member-details');
            if (is_creator) {
                let memberHTML = `<div class='col-lg-8 col-md-8 col-12 d-flex align-items-center text-break'><span class='member-badge me-3'><i class="bi bi-person-circle"></i></span>${member.email}</div>`;
                let memberAdminHTML = `<button class='btn btn-warning btn-sm make-admin-btn text-nowrap' data-id='${member.id}'>Make Admin</button></div>`;
                let memberRemoveHTML = `<div class='col-lg-3 col-md-2 col-12 d-flex ms-2 gap-2 justify-content-sm-center'><button class='btn btn-danger btn-sm remove-member-btn' data-id='${member.id}'>Remove</button>`;
                if (board_admins.includes(member.id)) {
                    memberHTML = `<div class='col-lg-8 col-md-8 col-12 d-flex align-items-center text-break'><span class='member-badge me-3'><i class='bi bi-person-circle'></i></span>${member.email} <i class="bi bi-star-fill ms-2" style='color: #D9DF14;'></i></div>`;
                    memberAdminHTML = `<button class='btn btn-primary btn-sm remove-admin-btn text-nowrap' data-id='${member.id}'>Revoke Admin</button></div>`;
                }

                memberDiv.innerHTML = `
                <div class='col-12'>
                    <div class='row d-flex align-items-center border border-secondary-subtle rounded mb-2 px-3 py-lg-0 py-md-0 py-2'>
                        ${memberHTML}
                        ${memberRemoveHTML}
                        ${memberAdminHTML}
                    </div>
                </div>
                `;
            } else {
                let memberHTML = `<div class='col-lg-8 col-11 d-flex align-items-center text-break'><span class='member-badge me-3'><i class="bi bi-person-circle"></i></span>${member.email}</div>`;
                if (board_admins.includes(member.id)) {
                        memberHTML = `<div class='col-lg-8 col-11 d-flex align-items-center text-break'><span class='member-badge me-3'><i class='bi bi-person-circle'></i></span>${member.email} <i class="bi bi-star-fill ms-2" style='color: #D9DF14;'></i></div>`;
                }
                memberDiv.innerHTML = `
                <div class='col-12'>
                    <div class='row d-flex align-items-center border border-secondary-subtle rounded mb-2 px-3'>
                        ${memberHTML}
                    </div>
                </div>`;
            }
            memberContainer.appendChild(memberDiv);
            const removeMemberBtn = memberDiv.querySelector('.remove-member-btn');
            if (removeMemberBtn != null) {
                removeMemberBtn.addEventListener('click', () => {
                    fetch(`/board/${slug}/members/${member.id}/remove/`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            board_admins = board_admins.filter(adminID => adminID != member.id);
                            getBoardMembers();
                        }
                    })
                }); 
            }
            
            const addAdminBtn = memberDiv.querySelector('.make-admin-btn');
            if (addAdminBtn != null) {
                addAdminBtn.addEventListener('click', () => {
                    fetch(`/board/${slug}/members/add-admin/${member.id}/`, {
                        method: 'PUT',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            board_admins.push(member.id);
                            getBoardMembers();
                        }
                    })
                })
            }

            const removeAdminBtn = memberDiv.querySelector('.remove-admin-btn');
            if (removeAdminBtn != null) {
                removeAdminBtn.addEventListener('click', () => {
                    fetch(`/board/${slug}/members/remove-admin/${member.id}/`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': csrfToken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            board_admins = board_admins.filter(adminID => adminID != member.id);
                            getBoardMembers();
                        }
                    })
                })
            }
        })
    })
    .catch(error => {
        console.error(error);
    })
}

function getCardUpdates(listID, cardID) {
    fetch(`/board/${slug}/list/${listID}/card/${cardID}/updates`, {
        method: 'GET',
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            const error = response.json();
            return error.then(errorData => {
                throw new Error(errorData.detail);
            });
        }
    })
    .then(data => {
        data = data.reverse();
        const updateDiv = document.querySelector('.card-activity-slot');
        updateDiv.innerHTML = '';
        data.forEach(update => {
            const updateDetails = document.createElement('span');
            updateDetails.classList.add('py-1');
            updateDetails.innerHTML = `<i class="bi bi-info-circle fw-bold"></i> ${update.detail}`;
            updateDiv.appendChild(updateDetails);
        })
    })
    .catch(error => {
        console.error(error);
    });
}


// Draggable Cards Function (Inspired / idea obtained from: https://codepen.io/anthony-dee/pen/YdKBry)
function patchListDraggable (cardId, currentlistID, newListID) {
    return fetch(`/board/${slug}/list/${currentlistID}/card/${cardId}/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken' : csrfToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'list': newListID
        })
    });
}

function updateCardPositions(listView) {
    let cardsDict = {};
    for (let i = 0; i < listView.childElementCount; i++) {
        cardsDict[listView.children[i].dataset.id] = i;
    } 
    fetch(`/board/${slug}/list/${listView.parentElement.dataset.id}/cards/`, {
        method: 'PATCH',
        headers: {
            'X-csrfToken' : csrfToken,
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            'positions' : cardsDict
        })
    });
}

document.addEventListener('dragstart', function(event) {
    beingDragged(event);
});

document.addEventListener('dragend', function(event) {
    dragStopped(event);
});

document.addEventListener('dragenter', function(event) {
    event.preventDefault();
});

document.addEventListener('dragover', function(event) {
    event.dataTransfer.dropEffect = 'link';
    event.preventDefault();

    let elBeingDragged = document.querySelector('.dragging');
    event.target.style.cursor = 'pointer !important';

    if(event.target.matches('.card-container')) {
        if (elBeingDragged.classList.contains('card-container')) {
            allowDrop(event);
        }
    }

    if (event.target.matches('.list-view') || event.target.matches('.list-container')) {
        if (elBeingDragged.classList.contains('card-container')) {
            emptyListDraggedOver(event);
        }
    }

    if (event.target.matches('.list-container') || event.target.matches('.list-board')) {
        if (elBeingDragged.classList.contains('list-container')) {
            allowSwitch(event);
        }
    }
});

function beingDragged(event) {
    if (event.target.classList.contains('card-container')) {
        const draggedEl = event.target;
        const currentListView = draggedEl.parentElement;
        const currentListID = currentListView.parentElement.dataset.id;
        draggedEl.dataset.prevlist = currentListID;
        draggedEl.classList.add('dragging');
        draggedEl.style.cursor = 'pointer !important';
    }   

    if (event.target.classList.contains('list-container')) {
        const draggedEl = event.target;
        draggedEl.classList.add('dragging');
    }
}

function dragStopped(event) {
    if (event.target.classList.contains('card-container')) {
        const draggedEl = event.target;
        
        if ('newlist' in draggedEl.dataset) {
            const listView = draggedEl.parentElement;
            patchListDraggable(draggedEl.dataset.id, draggedEl.dataset.prevlist, draggedEl.dataset.newlist)
            .then(response => {
                if (response.ok) {
                    updateCardPositions(listView);
                }
            })
            .catch((error) => {
                console.error(error);
            })
        } else {
            const listView = draggedEl.parentElement;
            updateCardPositions(listView);
        }
        delete draggedEl.dataset.prevlist;
        draggedEl.classList.remove('dragging');
    }

    if (event.target.classList.contains('list-container')) {
        const draggedEl = event.target;
        updateListPositions();
        draggedEl.classList.remove('dragging');
    }
}


function allowDrop(event) {
    event.preventDefault();
    const dragOver = event.target;
    const dragOverParent = dragOver.parentElement;
    const elBeingDragged = document.querySelector('.dragging');
    const elBeingDraggedParent = elBeingDragged.parentElement;
    const elBeingDragggedIndex = whichChild(elBeingDragged);
    const dragOverIndex = whichChild(dragOver);

    if(dragOverParent == elBeingDraggedParent) {
        if (elBeingDragggedIndex < dragOverIndex) {
            elBeingDraggedParent.insertBefore(dragOver, elBeingDragged);
        }

        if (elBeingDragggedIndex > dragOverIndex) {
            elBeingDraggedParent.insertBefore(dragOver, elBeingDragged.nextSibling);
        }
    }

    if (dragOverParent != elBeingDraggedParent) {
        const newListID = dragOverParent.parentElement.dataset.id;
        dragOverParent.insertBefore(elBeingDragged, dragOver);
        elBeingDragged.dataset.newlist = newListID;
    }
}

function allowSwitch(event) {
    event.preventDefault();
    const dragOver = event.target;
    const dragOverParent = event.target.parentElement;
    const elBeingDragged = document.querySelector('.dragging');
    const elBeingDraggedParent = elBeingDragged.parentElement;
    const elBeingDragggedIndex = whichChild(elBeingDragged);
    const dragOverIndex = whichChild(dragOver);


    if (elBeingDragged != dragOver) {
        if(dragOverParent == elBeingDraggedParent) {
            if (elBeingDragggedIndex < dragOverIndex) {
                dragOverParent.insertBefore(dragOver, elBeingDragged);
            }
            if (elBeingDragggedIndex > dragOverIndex) {
                dragOverParent.insertBefore(dragOver, elBeingDragged.nextSibling);
            }
        }  
    }


}

function emptyListDraggedOver(event) {
    const dragOver = event.target;
    const elBeingDragged = document.querySelector(".dragging");
    const newListID = dragOver.parentElement.dataset.id;

    if (dragOver.classList.contains('list-view') && (dragOver.childElementCount === 0 || event.clientY > dragOver.children[dragOver.childElementCount - 1].offsetTop)) {
        dragOver.appendChild(elBeingDragged);
        elBeingDragged.dataset.newlist = newListID;
    }
}

function whichChild(el) {
    let i = 0;
    while ((el = el.previousSibling) != null) ++i;
    return i;
}

function updateListPositions() {
    const listBoard = document.querySelector('.list-board');
    let listsDict = {};
    for (let i = 0; i < (listBoard.childElementCount - 1); i++) {
        listsDict[listBoard.children[i].dataset.id] = i;
    } 
    fetch(`/board/${slug}/lists/`, {
        method: 'PATCH',
        headers: {
            'X-csrfToken' : csrfToken,
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
            'positions' : listsDict
        })
    });
}

