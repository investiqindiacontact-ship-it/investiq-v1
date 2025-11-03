const chatPopup = document.getElementById('chat-popup');
const chatButton = document.getElementById('chat-button');
const closeChatButton = document.getElementById('close-chat');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat');
const searchBar = document.getElementById('search-bar');
const companyDataList = document.getElementById('company-list');
const lineCanvas = document.getElementById('line-canvas');
const centralCompany = document.querySelector('.central-company');


let allCompanyData = [];
const defaultCompanyId = 'RELIANCE';

document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

async function initialize() {
    try {
        
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allCompanyData = data.companies; 

        populateSearchDatalist();
        setupEventListeners();
        
        
        const defaultCompany = allCompanyData.find(c => c.id === defaultCompanyId);
        if (defaultCompany) {
            updateUI(defaultCompanyId);
        } else {
             document.getElementById('company-name').textContent = "Default company not found.";
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        document.getElementById('company-name').textContent = "Error loading data.";
    }
}
/**
 * Updates the entire visualization with data for the given company ID.
 * @param {string} companyId - The ID of the company to display.
 */
function updateUI(companyId) {
    const currentCompany = allCompanyData.find(c => c.id === companyId);
    if (!currentCompany) return;

    document.getElementById('company-logo').src = currentCompany.logo || 'https://placehold.co/80x80/ffffff/1a1a2e?text=Logo';
    document.getElementById('company-name').textContent = currentCompany.name;
    document.getElementById('company-sector').textContent = currentCompany.sector;
    searchBar.value = currentCompany.name; 

    createInfoBox('major-investors-box', 'Major Investors', currentCompany.investors || []);
    updateFinancialsBox('financials-box', currentCompany.financials || {});

    const suppliers = currentCompany.suppliers || {};
    createInfoBox('indian-suppliers-box', 'Indian Suppliers', suppliers.indian || []);
    createInfoBox('global-suppliers-box', 'Global Suppliers & Partners', suppliers.global || []);

    const competition = currentCompany.competition || {};
    createCompetitorsBox('indian-competitors-box', 'Indian Competitors', competition.indian || []);
    createCompetitorsBox('global-competitors-box', 'Global Competitors', competition.global || []);

    setTimeout(drawAllLines, 50);
}

function createInfoBox(boxId, title, items) {
    const boxElement = document.getElementById(boxId);
    boxElement.innerHTML = `<h3>${title}</h3><ul></ul>`; 
    const ulElement = boxElement.querySelector('ul');

    if (items && items.length > 0) {
        items.slice(0, 3).forEach(item => { 
            const li = document.createElement('li');
            li.innerHTML = `<span>${item}</span>`;
            ulElement.appendChild(li);
        });
        boxElement.classList.remove('no-data');
    } else {
        boxElement.innerHTML = `<h3>${title}</h3><p class="no-data" style="color: var(--text-secondary); font-style: italic;">No data available</p>`;
        boxElement.classList.add('no-data');
    }
}

function updateFinancialsBox(boxId, financials) {
    const boxElement = document.getElementById(boxId);
    boxElement.innerHTML = `<h3>Finances</h3><ul></ul>`;
    const ulElement = boxElement.querySelector('ul');

    if (financials && Object.keys(financials).length > 0) {
        const displayKeys = ["Market Cap", "P/E Ratio", "Revenue", "PAT", "YTD Return"];
        displayKeys.forEach(key => {
            if (financials[key]) {
                const li = document.createElement('li');
                li.innerHTML = `<span>${key}:</span> <span>${financials[key]}</span>`;
                ulElement.appendChild(li);
            }
        });
        boxElement.classList.remove('no-data');
    } else {
        boxElement.innerHTML = `<h3>Finances</h3><p class="no-data" style="color: var(--text-secondary); font-style: italic;">No data available</p>`;
        boxElement.classList.add('no-data');
    }
}

function createCompetitorsBox(boxId, title, competitorIds) {
    const boxElement = document.getElementById(boxId);
    boxElement.innerHTML = `<h3>${title}</h3><ul></ul>`;
    const ulElement = boxElement.querySelector('ul');

    if (competitorIds && competitorIds.length > 0) {
        competitorIds.slice(0, 3).forEach(id => { 
            const competitor = allCompanyData.find(c => c.id === id);
            if (competitor) {
                const li = document.createElement('li');
                
                li.innerHTML = `<span><a href="#" class="competitor-link" data-id="${competitor.id}">${competitor.name}</a></span><i class="fas fa-chevron-right" style="color: var(--text-secondary); font-size: 0.7rem;"></i>`;
                ulElement.appendChild(li);
            }
        });
        boxElement.classList.remove('no-data');
    } else {
        boxElement.innerHTML = `<h3>${title}</h3><p class="no-data" style="color: var(--text-secondary); font-style: italic;">No data available</p>`;
        boxElement.classList.add('no-data');
    }
}

function populateSearchDatalist() {
    allCompanyData.forEach(company => {
        const option = document.createElement('option');
        option.value = company.name; 
        companyDataList.appendChild(option);
    });
}

function setupEventListeners() {
    searchBar.addEventListener('change', async () => {
        const company = allCompanyData.find(c => 
            c.name.trim().toLowerCase() === searchBar.value.trim().toLowerCase()
        );
        if (company) {
            updateUI(company.id);
        } else {
            console.warn(`Company not found for search value: ${searchBar.value}`);
        }
    });

    document.querySelector('.company-hub').addEventListener('click', (event) => {
        const link = event.target.closest('.competitor-link');
        if (link) {
            event.preventDefault();
            const targetCompanyId = link.dataset.id;
            if (targetCompanyId) {
                updateUI(targetCompanyId);
            }
        }
    });

    chatButton.addEventListener('click', () => {
        chatPopup.style.display = chatPopup.style.display === 'flex' ? 'none' : 'flex';
        if (chatPopup.style.display === 'flex') { chatInput.focus(); }
    });
    closeChatButton.addEventListener('click', () => { chatPopup.style.display = 'none'; });
    sendChatButton.addEventListener('click', handleAIChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { handleAIChat(); }
    });
    
    window.addEventListener('resize', drawAllLines);
}

/**
 * Creates the reusable arrowhead marker definition for SVG paths.
 * @param {SVGElement} svg - The SVG element to attach definitions to.
 */
function createArrowheadMarker(svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse'); 

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z'); 
    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);
}


function getElementBounds(element) {
    const hub = document.querySelector('.company-hub');
    if (!hub) return null;
    const hubRect = hub.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return {
        left: elementRect.left - hubRect.left,
        top: elementRect.top - hubRect.top,
        width: elementRect.width,
        height: elementRect.height,
        centerX: (elementRect.left - hubRect.left) + elementRect.width / 2,
        centerY: (elementRect.top - hubRect.top) + elementRect.height / 2
    };
}

function drawAllLines() {
 
    if (window.innerWidth <= 768) {
        lineCanvas.innerHTML = ''; 
        return;
    }

    lineCanvas.innerHTML = ''; 
    createArrowheadMarker(lineCanvas);

    const centralBounds = getElementBounds(centralCompany);
    const outerBoxes = document.querySelectorAll('.outer-box');

    if (!centralBounds) return;

    outerBoxes.forEach(box => {
        const boxBounds = getElementBounds(box);
        if (!boxBounds) return;

        let startX, startY, endX, endY;
        let controlX1, controlY1, controlX2, controlY2;

        const centralRadius = centralBounds.width / 2;

        const angle = Math.atan2(centralBounds.centerY - boxBounds.centerY, centralBounds.centerX - boxBounds.centerX);
        endX = centralBounds.centerX - centralRadius * Math.cos(angle);
        endY = centralBounds.centerY - centralRadius * Math.sin(angle);
        
        const offset = 70; 

        if (box.id === 'major-investors-box') { 
            startX = boxBounds.centerX;
            startY = boxBounds.top + boxBounds.height;
            endX = centralBounds.centerX;
            endY = centralBounds.centerY - centralRadius;
            drawLine(lineCanvas, startX, startY, endX, endY);
            return;
        } else if (box.id === 'financials-box') { 
            startX = boxBounds.centerX;
            startY = boxBounds.top;
            endX = centralBounds.centerX;
            endY = centralBounds.centerY + centralRadius;
            drawLine(lineCanvas, startX, startY, endX, endY);
            return;
        }

        const isLeft = (box.id === 'indian-suppliers-box' || box.id === 'global-suppliers-box');
        
        startX = isLeft ? (boxBounds.left + boxBounds.width) : boxBounds.left;
        startY = boxBounds.centerY;

        controlX1 = isLeft ? startX + offset : startX - offset; 
        controlY1 = startY;

        controlX2 = isLeft ? (centralBounds.centerX - centralRadius * 0.5) : (centralBounds.centerX + centralRadius * 0.5); 
        controlY2 = endY; 

        drawPath(lineCanvas, startX, startY, controlX1, controlY1, controlX2, controlY2, endX, endY);
    });
}

function drawPath(svg, x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(path);
}

function drawLine(svg, x1, y1, x2, y2) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(line);
}

async function handleAIChat() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    appendMessage(userMessage, 'user');
    chatInput.value = '';

    const loadingDiv = appendMessage('AI is thinking...', 'ai loading-indicator');

    const currentCompanyName = document.getElementById('company-name').textContent;
    const currentCompany = allCompanyData.find(c => c.name === currentCompanyName);
    
    let aiResponse = "I'm sorry, I can't access live data right now. My knowledge is limited to the network data shown for " + (currentCompany ? currentCompany.name : 'the selected company') + ". Try asking about 'investors' or 'competitors'.";
    
    if (currentCompany) {
        if (userMessage.toLowerCase().includes('competitors')) {
            const indian = currentCompany.competition?.indian.map(id => allCompanyData.find(c => c.id === id)?.name || id).join(', ');
            const global = currentCompany.competition?.global.join(', ');
            aiResponse = `The main Indian competitors of ${currentCompany.name} are: ${indian}. Global competitors and rivals include: ${global}.`;
        } else if (userMessage.toLowerCase().includes('investors')) {
             aiResponse = `The major investors in ${currentCompany.name} are: ${currentCompany.investors.join(', ')}.`;
        } else if (userMessage.toLowerCase().includes('sector')) {
            aiResponse = `${currentCompany.name} is in the ${currentCompany.sector} sector.`;
        }
    }

    setTimeout(() => {
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
        appendMessage(aiResponse, 'ai');
    }, 1500); 
}

function appendMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', type);
    messageDiv.textContent = message;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return messageDiv;
}