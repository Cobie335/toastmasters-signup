// Global state
let isAdmin = false;
let signups = {};
let signupDetails = {};
let blockedSpots = {};
let currentSignup = null;
let tempDetails = {};
let tempDetailFields = [];

// Role definitions with default values
const oddSpotTopics = [
    "Other",
    "Who/What am I?",
    "Travel Tales",
    "Movie/TV Reviews",
    "Book Review",
    "Show and Tell",
    "Smile Time",
    "Literature For Everyone",
    "A Day In History",
    "The Inspiration",
    "Point Of View",
    "Animal Story",
    "A Day At Work",
    "A Day Off Work",
    "The Interview",
    "Musical Notes",
    "The Hot Seat",
    "Lesson I've Learned",
    "Discoveries And Inventions"
];

let roles = [
    { name: "Toastmaster", spots: 2 },
    { 
        name: "Pathway Speeches", 
        spots: 4,
        requiresDetails: true,
        detailFields: [
            { name: "speechTitle", label: "Speech Title" },
            { name: "projectPathway", label: "Project Pathway", example: "e.g., Presentation Mastery" },
            { name: "speechLevel", label: "Speech Level", example: "e.g., Level 1, Intro To Vocal Variety & Body Language" }
        ]
    },
    { name: "Evaluators", spots: 4 },
    { 
        name: "Odd Spots", 
        spots: 4,
        requiresDetails: true,
        detailFields: [
            { name: "topic", label: "Topic/Title", type: "select", options: oddSpotTopics }
        ]
    },
    { name: "Table Topics", spots: 2 },
    { name: "Round Robin", spots: 2 },
    { name: "Harkmaster", spots: 2 },
    { name: "General Evaluator", spots: 2 },
    { 
        name: "Education Workshop", 
        spots: 1,
        requiresDetails: true,
        detailFields: [
            { name: "title", label: "Workshop Title" }
        ]
    },
    { name: "Word of the Day", spots: 2 },
    { name: "Gramarian's Report", spots: 2 },
    { name: "Official Welcome", spots: 2 },
    { name: "Meeting Introduction", spots: 2 },
    { name: "Timer", spots: 2 },
    { name: "Apologies", spots: 8 },
    { name: "Supper", spots: 1 },
    { name: "Raffle", spots: 1 }
];

// Meeting dates with default value
let meetingDates = [];

// Initialize meeting dates if empty
function initializeMeetingDates() {
    if (meetingDates.length === 0) {
        const currentDate = new Date();
        // Set to next Tuesday
        currentDate.setDate(currentDate.getDate() + (9 - currentDate.getDay()) % 7);
        
        for (let i = 0; i < 8; i++) {
            const newDate = new Date(currentDate);
            meetingDates.push(newDate);
            currentDate.setDate(currentDate.getDate() + 14); // Add 14 days
        }
    }
}

// Format date for display
function formatDate(date) {
    return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format date for input value
function formatDateForInput(date) {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Setup table headers with meeting dates
function setupTableHeaders() {
    const headerRow = document.querySelector('#roleTable thead tr');
    
    // Clear existing headers except the first one (Role)
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    meetingDates.forEach(date => {
        const th = document.createElement('th');
        th.textContent = formatDate(date);
        headerRow.appendChild(th);
    });
}

// Initialize table with roles and spots
function setupRolesTable() {
    const tableBody = document.querySelector('#roleTable tbody');
    tableBody.innerHTML = ''; // Clear existing content
    
    roles.forEach(role => {
        const tr = document.createElement('tr');
        
        // Role name cell
        const roleCell = document.createElement('td');
        roleCell.className = 'role-cell';
        roleCell.textContent = role.name;
        tr.appendChild(roleCell);
        
        // Create cells for each meeting date
        meetingDates.forEach(date => {
            const td = document.createElement('td');
            const spotsContainer = document.createElement('div');
            
            // Create buttons for each spot
            for (let spotIndex = 0; spotIndex < role.spots; spotIndex++) {
                const key = `${date.toLocaleDateString()}-${role.name}-${spotIndex}`;
                const button = document.createElement('button');
                button.className = 'spot-button';
                button.textContent = signups[key] || 'Available';
                button.dataset.key = key;
                button.dataset.date = date.toLocaleDateString();
                button.dataset.role = role.name;
                button.dataset.spotIndex = spotIndex;
                button.dataset.requiresDetails = role.requiresDetails || false;
                
                if (signups[key]) {
                    button.classList.add('signed-up');
                }
                
                if (blockedSpots[key]) {
                    button.classList.add('blocked');
                    button.disabled = !isAdmin;
                }
                
                button.addEventListener('click', function() {
                    const key = this.dataset.key;
                    const date = new Date(this.dataset.date);
                    const roleName = this.dataset.role;
                    const spotIndex = parseInt(this.dataset.spotIndex);
                    const requiresDetails = this.dataset.requiresDetails === 'true';
                    
                    const role = roles.find(r => r.name === roleName);
                    
                    handleSignup(date, role, spotIndex);
                });
                
                spotsContainer.appendChild(button);
                
                // Add admin block button if in admin mode
                if (isAdmin) {
                    const blockButton = document.createElement('button');
                    blockButton.textContent = blockedSpots[key] ? '🔓' : '🔒';
                    blockButton.style.marginLeft = '4px';
                    blockButton.title = blockedSpots[key] ? 'Unblock spot' : 'Block spot';
                    blockButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        toggleSpotBlock(date, role.name, spotIndex);
                    });
                    spotsContainer.appendChild(blockButton);
                }
            }
            
            td.appendChild(spotsContainer);
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
}

// Display roles in admin section
function displayRolesInAdmin() {
    const rolesList = document.getElementById('rolesList');
    rolesList.innerHTML = '';
    
    roles.forEach((role, index) => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-item';
        
        const roleInfo = document.createElement('div');
        roleInfo.innerHTML = `<strong>${role.name}</strong> - ${role.spots} spot(s)${role.requiresDetails ? ' (Requires details)' : ''}`;
        
        const buttonsDiv = document.createElement('div');
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.style.backgroundColor = '#004165';
        editButton.style.marginRight = '5px';
        editButton.addEventListener('click', () => {
            editRole(index);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
                roles.splice(index, 1);
                displayRolesInAdmin();
                setupRolesTable();
                saveDataToLocalStorage();
            }
        });
        
        buttonsDiv.appendChild(editButton);
        buttonsDiv.appendChild(deleteButton);
        
        roleItem.appendChild(roleInfo);
        roleItem.appendChild(buttonsDiv);
        rolesList.appendChild(roleItem);
    });
}

// Display meeting dates in admin section
function displayMeetingsInAdmin() {
    const meetingsList = document.getElementById('meetingsList');
    meetingsList.innerHTML = '';
    
    meetingDates.forEach((date, index) => {
        const meetingItem = document.createElement('div');
        meetingItem.className = 'meeting-item';
        
        const dateText = document.createElement('span');
        dateText.textContent = formatDate(date);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.style.border = 'none';
        deleteButton.style.background = 'none';
        deleteButton.style.fontSize = '18px';
        deleteButton.style.color = '#ff6b6b';
        deleteButton.style.cursor = 'pointer';
        deleteButton.title = 'Remove this meeting date';
        
        deleteButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to remove the meeting on ${formatDate(date)}?`)) {
                meetingDates.splice(index, 1);
                displayMeetingsInAdmin();
                setupTableHeaders();
                setupRolesTable();
                saveDataToLocalStorage();
            }
        });
        
        meetingItem.appendChild(dateText);
        meetingItem.appendChild(deleteButton);
        meetingsList.appendChild(meetingItem);
    });
}

// Edit role
function editRole(index) {
    const role = roles[index];
    
    document.getElementById('newRoleName').value = role.name;
    document.getElementById('newRoleSpots').value = role.spots;
    document.getElementById('requiresDetailsCheck').checked = role.requiresDetails || false;
    
    // Show/hide detail fields container
    document.getElementById('detailFieldsContainer').style.display = 
        role.requiresDetails ? 'block' : 'none';
    
    // Clear and populate detail fields list
    tempDetailFields = role.detailFields ? [...role.detailFields] : [];
    displayDetailFields();
    
    // Change button to update mode
    const addRoleButton = document.getElementById('addRoleButton');
    addRoleButton.textContent = 'Update Role';
    addRoleButton.dataset.mode = 'edit';
    addRoleButton.dataset.index = index;
    
    // Scroll to the role form
    document.getElementById('newRoleName').scrollIntoView({ behavior: 'smooth' });
}

// Display detail fields in admin
function displayDetailFields() {
    const fieldsList = document.getElementById('detailFieldsList');
    fieldsList.innerHTML = '';
    
    tempDetailFields.forEach((field, index) => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';
        
        const fieldInfo = document.createElement('div');
        fieldInfo.style.flexGrow = '1';
        
        let fieldDescription = `<strong>${field.label}</strong> (${field.name})`;
        if (field.type === 'select') {
            fieldDescription += ` - Dropdown with ${field.options?.length || 0} options`;
        }
        if (field.example) {
            fieldDescription += ` - Example: "${field.example}"`;
        }
        
        fieldInfo.innerHTML = fieldDescription;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.style.border = 'none';
        deleteButton.style.background = '#ff6b6b';
        deleteButton.style.color = 'white';
        deleteButton.style.borderRadius = '50%';
        deleteButton.style.width = '24px';
        deleteButton.style.height = '24px';
        deleteButton.style.cursor = 'pointer';
        
        deleteButton.addEventListener('click', () => {
            tempDetailFields.splice(index, 1);
            displayDetailFields();
        });
        
        fieldItem.appendChild(fieldInfo);
        fieldItem.appendChild(deleteButton);
        fieldsList.appendChild(fieldItem);
    });
}

// Toggle spot blocking
function toggleSpotBlock(date, roleName, spotIndex) {
    const key = `${date.toLocaleDateString()}-${roleName}-${spotIndex}`;
    blockedSpots[key] = !blockedSpots[key];
    
    // If blocking a spot that's already taken, confirm and clear it
    if (blockedSpots[key] && signups[key]) {
        if (confirm(`This spot is currently assigned to ${signups[key]}. Do you want to remove this assignment?`)) {
            delete signups[key];
            delete signupDetails[key];
        }
    }
    
    setupRolesTable();
    saveDataToLocalStorage();
}

// Handle admin login button
document.getElementById('adminButton').addEventListener('click', function() {
    document.getElementById('adminModal').style.display = 'flex';
});

// Close admin modal
function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

// Handle admin login
function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'VP-agenda') {
        isAdmin = true;
        document.getElementById('adminButton').textContent = 'Admin Mode Active';
        document.getElementById('adminTools').style.display = 'block';
        closeAdminModal();
        
        // Initialize meeting dates if needed
        initializeMeetingDates();
        
        // Update the admin interface
        displayRolesInAdmin();
        displayMeetingsInAdmin();
        
        // Update the table with admin controls
        setupRolesTable();
    } else {
        alert('Incorrect password');
    }
}

// Handle signup
function handleSignup(date, role, spotIndex) {
    const key = `${date.toLocaleDateString()}-${role.name}-${spotIndex}`;
    
    // If already signed up, handle deselection
    if (signups[key