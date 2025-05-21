// Variables to track state
let spriteContainer = null;
let popupMenu = null;
let taskPopup = null;
let isDragging = false;
let offsetX, offsetY;
let isPopupOpen = false;
let isTaskPopupOpen = false;
let manageTasksPopup = null;
let isManageTasksPopupOpen = false;
let alarmPopup = null;
let alarmPopupTimeout = null;
let isEditMode = false;
let editTaskId = null;
let taskInput, dateInput, timeInput;
let currentTaskPopupHandler = null;
let editTaskPopup = null;
let editTaskInput, editDateInput, editTimeInput;
let currentEditTaskPopupHandler = null;
let chatPopup = null;
let isChatPopupOpen = false;
let chatInput = null;
let chatSendBtn = null;
let chatMessagesArea = null;

// Gemini API key placeholder
const GEMINI_API_KEY = 'AIzaSyB5z6qjM18BH5uKDoB5W1yDoBqMBRS1cVk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'removeSprite') {
    removeSprite();
  }
  if (message.action === 'showAlarmPopup' && message.task) {
    showAlarmPopup(message.task);
  }
  if (message.action === 'checkPastTasks') {
    checkPastTasks();
  }
});

// Function to remove the sprite
function removeSprite() {
  if (spriteContainer) {
    spriteContainer.remove();
    spriteContainer = null;
    popupMenu = null;
    taskPopup = null;
  }
}

// Function to create and inject the sprite container
function createSpriteContainer() {
  if (spriteContainer) return; // Already exists
  
  // Create container div
  spriteContainer = document.createElement('div');
  spriteContainer.id = 'interactive-sprite-container';
  spriteContainer.allowtransparency = 'true';
  spriteContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    height: 400px;
    z-index: 2147483647;
    border: none;
    box-shadow: none;
    user-select: none;
    overflow: visible;
    background-color: transparent;
    background: transparent;
  `;

  // Attach shadow root
  const shadow = spriteContainer.attachShadow({ mode: 'open' });

  // Create a <style> tag for all popup CSS
  const popupStyle = document.createElement('style');
  popupStyle.textContent = `
    /* All your popup CSS here, including scrollbar styles */
    .manage-tasks-completed-tab::-webkit-scrollbar,
    .manage-tasks-ongoing-tab::-webkit-scrollbar,
    .manage-tasks-pending-tab::-webkit-scrollbar {
      width: 10px !important;
      background: #222 !important;
    }
    .manage-tasks-completed-tab::-webkit-scrollbar-thumb,
    .manage-tasks-ongoing-tab::-webkit-scrollbar-thumb,
    .manage-tasks-pending-tab::-webkit-scrollbar-thumb {
      background: #AFB3B7 !important;
      border-radius: 8px !important;
    }
    .manage-tasks-completed-tab::-webkit-scrollbar-track,
    .manage-tasks-ongoing-tab::-webkit-scrollbar-track,
    .manage-tasks-pending-tab::-webkit-scrollbar-track {
      background: #222 !important;
      border-radius: 8px !important;
    }
    .manage-tasks-completed-tab,
    .manage-tasks-ongoing-tab,
    .manage-tasks-pending-tab {
      scrollbar-width: thin !important;
      scrollbar-color: #AFB3B7 #222 !important;
    }
    /* Add any other popup styles you want to protect here */
  `;
  shadow.appendChild(popupStyle);

  // Create the iframe with the Spline sprite
  const spriteIframe = document.createElement('iframe');
  spriteIframe.src = 'https://my.spline.design/robotcat-53c678c5de84109a0d9f2fe44b94d4b6/';
  spriteIframe.frameborder = '0';
  spriteIframe.allowtransparency = 'true';
  spriteIframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: auto;
    background-color : transparent;
  `;
  
  // Add a small draggable area in the center of the sprite
  const dragHandle = document.createElement('div');
  dragHandle.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: move;
    z-index: 2147483648;
  `;
  
  // Add a clickable area below the drag handle
  const clickArea = document.createElement('div');
  clickArea.style.cssText = `
    position: absolute;
    top: 60%;
    left: 50%;
    transform: translate(-50%, 0);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483648;
  `;
  
  // Create popup menu
  popupMenu = document.createElement('div');
  popupMenu.style.cssText = `
    position: absolute;
    top: 0;
    right: -120px;
    width: 220px;
    background: rgba(13,31,35,0.92);
    border-radius: 18px;
    box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
    border: 1.5px solid #2D4A53;
    padding: 18px 16px;
    z-index: 2147483649;
    display: none;
    color: #AFB3B7;
    font-family: 'Segoe UI', Arial, sans-serif;
  `;
  
  // Create task popup
  taskPopup = document.createElement('div');
  taskPopup.style.cssText = `
    position: absolute;
    top: 0;
    right: -250px;
    width: 270px;
    background: rgba(19,46,53,0.92);
    border-radius: 18px;
    box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
    border: 1.5px solid #2D4A53;
    padding: 22px 20px 18px 20px;
    z-index: 2147483649;
    display: none;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #AFB3B7;
  `;
  
  // Create task popup content
  const taskPopupTitle = document.createElement('h3');
  taskPopupTitle.textContent = 'Set Task Reminder';
  taskPopupTitle.style.cssText = `
    margin: 0 0 15px 0;
    font-size: 22px;
    color: #fff;
    font-weight: bold;
    letter-spacing: 0.5px;
  `;
  
  // Task description input
  taskInput = document.createElement('textarea');
  taskInput.placeholder = 'Enter task description';
  taskInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    margin-bottom: 15px;
    font-family: 'Segoe UI', Arial, sans-serif;
    resize: vertical;
    min-height: 60px;
    box-sizing: border-box;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;
  
  // Set placeholder color for taskInput
  if (taskInput) {
    taskInput.setAttribute('style', taskInput.style.cssText + '::placeholder { color: #AFB3B7 !important; opacity: 1; }');
    // Fallback for browsers that don't support ::placeholder in setAttribute
    taskInput.placeholder = 'Enter task description';
  }
  
  // Date and time container
  const dateTimeContainer = document.createElement('div');
  dateTimeContainer.style.cssText = `
    display: flex;
    margin-bottom: 15px;
    gap: 8px;
  `;
  
  // Date input
  const dateContainer = document.createElement('div');
  dateContainer.style.cssText = `
    position: relative;
    flex: 1;
    max-width: none;
  `;
  
  dateInput = document.createElement('input');
  dateInput.type = 'date';
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  dateInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 13px;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;
  
  // Time input
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = `
    position: relative;
    flex: 1;
    max-width: none;
  `;
  
  timeInput = document.createElement('input');
  timeInput.type = 'time';
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  timeInput.value = `${hours}:${minutes}`;
  timeInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 13px;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;
  
  // Set reminder button
  const reminderButton = document.createElement('button');
  reminderButton.textContent = 'Set Reminder';
  reminderButton.style.cssText = `
    width: 100%;
    padding: 12px;
    background-color: #AFB3B7;
    color: #0D1F23;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 2px 8px 0 rgba(175,179,183,0.18);
    transition: background 0.2s, color 0.2s;
  `;
  
  reminderButton.addEventListener('mouseover', () => {
    reminderButton.style.backgroundColor = '#69818D';
    reminderButton.style.color = '#fff';
  });
  
  reminderButton.addEventListener('mouseout', () => {
    reminderButton.style.backgroundColor = '#AFB3B7';
    reminderButton.style.color = '#0D1F23';
  });
  
  // Add close button for task popup
  const closeTaskButton = document.createElement('div');
  closeTaskButton.innerHTML = '×';
  closeTaskButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 10px;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  `;
  
  closeTaskButton.addEventListener('click', (e) => {
    e.stopPropagation();
    hideTaskPopup();
  });
  
  // Assemble the date and time containers
  dateContainer.appendChild(dateInput);
  timeContainer.appendChild(timeInput);
  dateTimeContainer.appendChild(dateContainer);
  dateTimeContainer.appendChild(timeContainer);
  
  // Assemble the task popup
  taskPopup.appendChild(closeTaskButton);
  taskPopup.appendChild(taskPopupTitle);
  taskPopup.appendChild(taskInput);
  taskPopup.appendChild(dateTimeContainer);
  taskPopup.appendChild(reminderButton);
  
  // Add menu options
  const options = [
    { text: 'Set Tasks / Reminders', action: 'setTasks' },
    { text: 'Edit Tasks / Manage Tasks', action: 'editTasks' },
    { text: 'Chat', action: 'chat' }
  ];
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;
    button.dataset.action = option.action;
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px 12px;
      margin-bottom: 10px;
      border: none;
      border-radius: 8px;
      background-color: #fff;
      color: #0D1F23;
      font-weight: 500;
      font-size: 17px;
      font-family: 'Segoe UI', Arial, sans-serif;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s, color 0.2s;
    `;
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#AFB3B7';
      button.style.color = '#0D1F23';
    });
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#fff';
      button.style.color = '#0D1F23';
    });
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      handleMenuAction(option.action);
    });
    popupMenu.appendChild(button);
  });
  
  // Make the drag handle draggable
  dragHandle.addEventListener('mousedown', startDragging);
  
  // Make the click area open the popup menu
  clickArea.addEventListener('click', togglePopupMenu);
  
  // Close popups when clicking elsewhere
  document.addEventListener('click', (e) => {
    // Only handle popups in the main DOM here
    if (isManageTasksPopupOpen && manageTasksPopup && !manageTasksPopup.contains(e.target)) {
      hideManageTasksPopup();
    }
    if (isChatPopupOpen && chatPopup && !chatPopup.contains(e.target)) {
      hideChatPopup();
    }
    if (alarmPopup && !alarmPopup.contains(e.target)) {
      closeAlarmPopup();
    }
  });
  
  // Append elements to shadow root
  shadow.appendChild(spriteIframe);
  shadow.appendChild(dragHandle);
  shadow.appendChild(clickArea);
  shadow.appendChild(popupMenu);
  shadow.appendChild(taskPopup);

  document.body.appendChild(spriteContainer);

  // Create chat popup
  chatPopup = document.createElement('div');
  chatPopup.style.cssText = `
    position: absolute;
    top: 0;
    right: -250px;
    width: 320px;
    min-height: 380px;
    max-height: 420px;
    background: rgba(19,46,53,0.96);
    border-radius: 18px;
    box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
    border: 1.5px solid #2D4A53;
    padding: 22px 20px 18px 20px;
    z-index: 2147483650;
    display: none;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #AFB3B7;
    flex-direction: column;
  `;
  // Title and close
  const chatTitle = document.createElement('div');
  chatTitle.textContent = 'Chat';
  chatTitle.style.cssText = 'font-size: 22px; color: #fff; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px;';
  const chatCloseBtn = document.createElement('div');
  chatCloseBtn.innerHTML = '×';
  chatCloseBtn.style.cssText = 'position: absolute; top: 8px; right: 14px; font-size: 20px; cursor: pointer; color: #666;';
  chatCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); hideChatPopup(); });
  chatPopup.appendChild(chatTitle);
  chatPopup.appendChild(chatCloseBtn);
  // Messages area
  chatMessagesArea = document.createElement('div');
  chatMessagesArea.style.cssText = 'margin: 10px 0 12px 0; padding: 10px; background: #22343a; border-radius: 10px; height: 220px; max-height: 220px; overflow-y: auto; font-size: 15px; display: flex; flex-direction: column; gap: 10px;';
  chatPopup.appendChild(chatMessagesArea);
  // Centered Clear Chat button row -> now left-aligned and smaller
  const clearChatRow = document.createElement('div');
  clearChatRow.style.cssText = 'display: flex; justify-content: flex-start; align-items: center; margin: 0 0 8px 0;';
  const clearChatBtn = document.createElement('button');
  clearChatBtn.textContent = 'Clear Chat';
  clearChatBtn.style.cssText = 'font-size: 12px; padding: 3px 10px; border-radius: 6px; background: #69818D; color: #fff; border: none; cursor: pointer; font-weight: 500; margin-left: 4px; transition: background 0.2s, color 0.2s;';
  clearChatBtn.addEventListener('mouseover', () => { clearChatBtn.style.background = '#AFB3B7'; clearChatBtn.style.color = '#0D1F23'; });
  clearChatBtn.addEventListener('mouseout', () => { clearChatBtn.style.background = '#69818D'; clearChatBtn.style.color = '#fff'; });
  clearChatBtn.onclick = function(e) {
    e.stopPropagation();
    chrome.storage.local.set({ chatMessages: [] }, loadChatMessages);
  };
  clearChatRow.appendChild(clearChatBtn);
  chatPopup.appendChild(clearChatRow);
  // Input row
  const chatInputRow = document.createElement('div');
  chatInputRow.style.cssText = 'display: flex; gap: 8px; align-items: center;';
  chatInput = document.createElement('input');
  chatInput.type = 'text';
  chatInput.placeholder = 'Type your message...';
  chatInput.style.cssText = 'flex: 1; padding: 10px; border-radius: 8px; border: 1.5px solid #5A636A; background: rgba(175,179,183,0.08); color: #fff; font-size: 15px;';
  chatSendBtn = document.createElement('button');
  chatSendBtn.textContent = 'Send';
  chatSendBtn.style.cssText = 'padding: 10px 18px; background: #AFB3B7; color: #0D1F23; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer;';
  chatSendBtn.addEventListener('mouseover', () => { chatSendBtn.style.backgroundColor = '#69818D'; chatSendBtn.style.color = '#fff'; });
  chatSendBtn.addEventListener('mouseout', () => { chatSendBtn.style.backgroundColor = '#AFB3B7'; chatSendBtn.style.color = '#0D1F23'; });
  chatInputRow.appendChild(chatInput);
  chatInputRow.appendChild(chatSendBtn);
  chatPopup.appendChild(chatInputRow);
  document.body.appendChild(chatPopup);

  // Bind chat input/send events after elements are created
  chatSendBtn.onclick = sendChatMessage;
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });

  // Call checkPastTasks when sprite is injected (extension ON)
  checkPastTasks();
}

function togglePopupMenu(e) {
  e.stopPropagation();
  if (isPopupOpen) {
    hidePopupMenu();
  } else {
    hideTaskPopup();
    if (isManageTasksPopupOpen) hideManageTasksPopup();
    showPopupMenu();
  }
}

function showPopupMenu() {
  if (popupMenu) {
    popupMenu.style.display = 'block';
    positionPopup(popupMenu, 200);
    isPopupOpen = true;
  }
}

function hidePopupMenu() {
  if (popupMenu) {
    popupMenu.style.display = 'none';
    isPopupOpen = false;
  }
}

function showTaskPopup() {
  if (taskPopup) {
    taskPopup.style.display = 'block';
    positionPopup(taskPopup, 340);
    isTaskPopupOpen = true;
    setTaskPopupSaveHandler();
  }
}

function hideTaskPopup() {
  if (taskPopup) {
    taskPopup.style.display = 'none';
    isTaskPopupOpen = false;
    // Reset edit mode
    isEditMode = false;
    editTaskId = null;
    // Reset title and button text
    const title = taskPopup.querySelector('h3');
    const button = taskPopup.querySelector('button');
    title.textContent = 'Set Task Reminder';
    button.textContent = 'Set Reminder';
  }
}

function showManageTasksPopup() {
  if (!manageTasksPopup) {
    manageTasksPopup = document.createElement('div');
    manageTasksPopup.style.cssText = `
      position: absolute;
      top: 0;
      right: -120px;
      width: 370px;
      height: 440px;
      min-height: 440px;
      max-height: 440px;
      background: rgba(13,31,35,0.96);
      border-radius: 22px;
      box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
      border: 1.5px solid #2D4A53;
      padding: 28px 28px 18px 28px;
      z-index: 2147483649;
      display: none;
      font-family: 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      color: #AFB3B7;
    `;

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 18px;
      font-size: 22px;
      cursor: pointer;
      color: #666;
      font-weight: bold;
    `;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideManageTasksPopup();
    });
    manageTasksPopup.appendChild(closeBtn);

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Manage Tasks';
    title.style.cssText = `
      margin: 0 0 18px 0;
      font-size: 22px;
      color: #fff;
      font-weight: bold;
      letter-spacing: 0.5px;
    `;
    manageTasksPopup.appendChild(title);

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = `
      display: flex;
      border-bottom: 2px solid #2D4A53;
      margin-bottom: 18px;
      gap: 0;
    `;
    const tabs = [
      { name: 'Ongoing', id: 'ongoing' },
      { name: 'Pending', id: 'pending' },
      { name: 'Completed', id: 'completed' }
    ];
    let currentTab = 'ongoing';
    const tabContents = {};

    tabs.forEach((tab, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.textContent = tab.name;
      tabBtn.style.cssText = `
        flex: 1;
        padding: 12px 0 10px 0;
        border: none;
        background: none;
        font-weight: bold;
        font-size: 15px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        color: #5A636A;
        transition: border-color 0.2s, background 0.2s, color 0.2s;
        outline: none;
      `;
      if (tab.id === currentTab) {
        tabBtn.style.borderBottomColor = '#AFB3B7';
        tabBtn.style.background = 'rgba(175,179,183,0.08)';
        tabBtn.style.color = '#AFB3B7';
      } else {
        tabBtn.style.borderBottomColor = 'transparent';
        tabBtn.style.background = 'none';
        tabBtn.style.color = '#5A636A';
      }
      tabBtn.addEventListener('click', () => {
        currentTab = tab.id;
        Array.from(tabBar.children).forEach((btn, i) => {
          btn.style.borderBottomColor = i === tabs.findIndex(t => t.id === currentTab) ? '#AFB3B7' : 'transparent';
          btn.style.background = i === tabs.findIndex(t => t.id === currentTab) ? 'rgba(175,179,183,0.08)' : 'none';
        });
        Object.keys(tabContents).forEach(key => {
          tabContents[key].style.display = key === currentTab ? 'block' : 'none';
        });
        // Refresh content based on selected tab
        if (currentTab === 'ongoing') {
          renderOngoingTasks(tabContents['ongoing']);
        } else if (currentTab === 'completed') {
          renderCompletedTasks(tabContents['completed']);
        } else if (currentTab === 'pending') {
          renderPendingTasks(tabContents['pending']);
        }
      });
      tabBar.appendChild(tabBtn);
    });
    manageTasksPopup.appendChild(tabBar);

    // Tab content containers
    tabs.forEach(tab => {
      const content = document.createElement('div');
      content.style.display = tab.id === currentTab ? 'block' : 'none';
      content.style.padding = '12px 0 0 0';
      content.style.fontSize = '15px';
      content.style.height = '320px';
      content.style.minHeight = '320px';
      content.style.maxHeight = '320px';
      content.style.overflowY = 'auto';
      tabContents[tab.id] = content;
      if (tab.id === 'completed') content.classList.add('manage-tasks-completed-tab');
      if (tab.id === 'ongoing') content.classList.add('manage-tasks-ongoing-tab');
      if (tab.id === 'pending') content.classList.add('manage-tasks-pending-tab');
      manageTasksPopup.appendChild(content);
    });

    // Initial render of all tabs
    renderOngoingTasks(tabContents['ongoing']);
    renderCompletedTasks(tabContents['completed']);
    renderPendingTasks(tabContents['pending']);

    document.body.appendChild(manageTasksPopup);
  }
  manageTasksPopup.style.display = 'block';
  positionPopup(manageTasksPopup, 340);
  isManageTasksPopupOpen = true;
}

function hideManageTasksPopup() {
  if (manageTasksPopup) {
    manageTasksPopup.style.display = 'none';
    isManageTasksPopupOpen = false;
  }
}

function handleMenuAction(action) {
  switch(action) {
    case 'setTasks':
      hidePopupMenu();
      showTaskPopup();
      break;
    case 'editTasks':
      hidePopupMenu();
      showManageTasksPopup();
      break;
    case 'chat':
      hidePopupMenu();
      hideTaskPopup();
      hideManageTasksPopup();
      showChatPopup();
      break;
  }
}

function startDragging(e) {
  e.preventDefault();
  e.stopPropagation();
  isDragging = true;
  
  const rect = spriteContainer.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragSprite);
  document.addEventListener('mouseup', stopDragging);
}

function dragSprite(e) {
  if (!isDragging) return;
  
  e.preventDefault();
  
  const newX = e.clientX - offsetX;
  const newY = e.clientY - offsetY;
  
  spriteContainer.style.left = `${newX}px`;
  spriteContainer.style.top = `${newY}px`;
  
  if (spriteContainer.style.right) {
    spriteContainer.style.right = '';
  }
}

function stopDragging() {
  isDragging = false;
  document.removeEventListener('mousemove', dragSprite);
  document.removeEventListener('mouseup', stopDragging);
  
  if (isPopupOpen) positionPopup(popupMenu, 200);
  if (isTaskPopupOpen) positionPopup(taskPopup, 340);
  if (isManageTasksPopupOpen) positionPopup(manageTasksPopup, 340);
}

function positionPopup(popup, popupWidth = 340) {
  if (!spriteContainer || !popup) return;
  const spriteRect = spriteContainer.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const margin = 12;
  
  let left = spriteRect.right + margin;
  let top = spriteRect.top;
  
  if (spriteRect.right + popupWidth + margin > windowWidth) {
    left = spriteRect.left - popupWidth - margin;
  }
  
  if (top + popup.offsetHeight > windowHeight) {
    top = windowHeight - popup.offsetHeight - margin;
  }
  if (top < margin) top = margin;
  
  popup.style.position = 'fixed';
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.right = '';
}

function formatRemainingTime(ms) {
  if (ms <= 0) return 'Time up!';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

function renderOngoingTasks(container) {
  chrome.storage.local.get(['tasks'], (result) => {
    let tasks = (result.tasks || []).filter(t => t.status === 'ongoing');
    const now = Date.now();
    tasks.sort((a, b) => (a.notifyAt - now) - (b.notifyAt - now));
    container.innerHTML = '';
    if (tasks.length === 0) {
      container.textContent = 'No ongoing tasks.';
      return;
    }
    tasks.forEach(task => {
      const remMs = task.notifyAt - now;
      const taskDiv = document.createElement('div');
      taskDiv.style.cssText = 'margin-bottom: 12px; padding: 10px; background: #2D4A53; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; color: #AFB3B7;';
      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `<div style=\"font-weight:bold; color:#AFB3B7;\">${task.description}</div><div style=\"color:#AFB3B7; font-size:13px; margin-top:4px;\">${formatRemainingTime(remMs)}</div>`;
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.cssText = 'background:#69818D; color:#fff; border:none; border-radius:4px; padding:6px 14px; font-weight:bold; cursor:pointer; font-size:13px; margin-left:8px;';
      editBtn.onclick = () => {
        showEditTaskPopupNew(task);
      };
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.cssText = 'background:#e53935; color:white; border:none; border-radius:4px; padding:6px 14px; font-weight:bold; cursor:pointer; font-size:13px; margin-left:8px;';
      deleteBtn.onclick = () => {
        chrome.storage.local.get(['tasks'], (result) => {
          let allTasks = result.tasks || [];
          allTasks = allTasks.filter(t => t.id !== task.id);
          chrome.storage.local.set({ tasks: allTasks }, () => {
            renderOngoingTasks(container);
          });
        });
      };
      const btnRow = document.createElement('div');
      btnRow.appendChild(editBtn);
      btnRow.appendChild(deleteBtn);
      taskDiv.appendChild(infoDiv);
      taskDiv.appendChild(btnRow);
      container.appendChild(taskDiv);
    });
  });
}

function createEditTaskPopup() {
  if (editTaskPopup) return;
  editTaskPopup = document.createElement('div');
  editTaskPopup.style.cssText = `
    position: absolute;
    top: 0;
    right: -250px;
    width: 270px;
    background: rgba(19,46,53,0.92);
    border-radius: 18px;
    box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
    border: 1.5px solid #2D4A53;
    padding: 22px 20px 18px 20px;
    z-index: 2147483649;
    display: none;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #AFB3B7;
  `;

  // Title
  const editPopupTitle = document.createElement('h3');
  editPopupTitle.textContent = 'Edit Task';
  editPopupTitle.style.cssText = `
    margin: 0 0 15px 0;
    font-size: 22px;
    color: #fff;
    font-weight: bold;
    letter-spacing: 0.5px;
  `;

  // Task description input
  editTaskInput = document.createElement('textarea');
  editTaskInput.placeholder = 'Enter task description';
  editTaskInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    margin-bottom: 15px;
    font-family: 'Segoe UI', Arial, sans-serif;
    resize: vertical;
    min-height: 60px;
    box-sizing: border-box;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;

  // Date and time container
  const dateTimeContainer = document.createElement('div');
  dateTimeContainer.style.cssText = `
    display: flex;
    margin-bottom: 15px;
    gap: 8px;
  `;

  // Date input
  const dateContainer = document.createElement('div');
  dateContainer.style.cssText = `
    position: relative;
    flex: 1;
    max-width: none;
  `;
  editDateInput = document.createElement('input');
  editDateInput.type = 'date';
  editDateInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 13px;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;

  // Time input
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = `
    position: relative;
    flex: 1;
    max-width: none;
  `;
  editTimeInput = document.createElement('input');
  editTimeInput.type = 'time';
  editTimeInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1.5px solid #5A636A;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 13px;
    background: rgba(175,179,183,0.08);
    color: #fff;
  `;

  // Save changes button
  const saveEditBtn = document.createElement('button');
  saveEditBtn.textContent = 'Save Changes';
  saveEditBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
  `;
  saveEditBtn.addEventListener('mouseover', () => {
    saveEditBtn.style.backgroundColor = '#3367d6';
  });
  saveEditBtn.addEventListener('mouseout', () => {
    saveEditBtn.style.backgroundColor = '#4285f4';
  });

  // Close button
  const closeEditBtn = document.createElement('div');
  closeEditBtn.innerHTML = '×';
  closeEditBtn.style.cssText = `
    position: absolute;
    top: 5px;
    right: 10px;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  `;
  closeEditBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideEditTaskPopup();
  });

  // Assemble date and time containers
  dateContainer.appendChild(editDateInput);
  timeContainer.appendChild(editTimeInput);
  dateTimeContainer.appendChild(dateContainer);
  dateTimeContainer.appendChild(timeContainer);

  // Assemble the edit popup
  editTaskPopup.appendChild(closeEditBtn);
  editTaskPopup.appendChild(editPopupTitle);
  editTaskPopup.appendChild(editTaskInput);
  editTaskPopup.appendChild(dateTimeContainer);
  editTaskPopup.appendChild(saveEditBtn);

  document.body.appendChild(editTaskPopup);
}

function showEditTaskPopupNew(task) {
  createEditTaskPopup();
  hideManageTasksPopup();
  // Pre-fill fields
  editTaskInput.value = task.description;
  editDateInput.value = task.date;
  editTimeInput.value = task.time;
  editTaskPopup.style.display = 'block';
  positionPopup(editTaskPopup, 340);
  editTaskPopup.style.zIndex = '2147483651';
  editTaskPopup.style.visibility = 'visible';
  editTaskPopup.style.opacity = '1';

  // Remove previous handler if any
  const saveEditBtn = editTaskPopup.querySelector('button');
  if (currentEditTaskPopupHandler) {
    saveEditBtn.removeEventListener('click', currentEditTaskPopupHandler);
  }
  // Define and add new handler
  currentEditTaskPopupHandler = function(e) {
    e.stopPropagation();
    const description = editTaskInput.value.trim();
    const date = editDateInput.value;
    const time = editTimeInput.value;
    if (!description || !date || !time) {
      alert('Please fill in all fields');
      return;
    }
    const notifyAt = new Date(`${date}T${time}`).getTime();
    if (isNaN(notifyAt) || notifyAt < Date.now()) {
      alert('Please enter a future date and time');
      return;
    }
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        tasks[idx].description = description;
        tasks[idx].date = date;
        tasks[idx].time = time;
        tasks[idx].notifyAt = notifyAt;
        chrome.storage.local.set({ tasks }, () => {
          hideEditTaskPopup();
          if (manageTasksPopup) {
            const ongoingContent = manageTasksPopup.querySelector('div:nth-child(5)');
            if (ongoingContent) renderOngoingTasks(ongoingContent);
          }
        });
      }
    });
  };
  saveEditBtn.addEventListener('click', currentEditTaskPopupHandler);
}

function hideEditTaskPopup() {
  if (editTaskPopup) {
    editTaskPopup.style.display = 'none';
  }
}

function renderCompletedTasks(container) {
  container.classList.add('manage-tasks-completed-tab');
  chrome.storage.local.get(['tasks'], (result) => {
    let tasks = (result.tasks || []).filter(t => t.status === 'completed');
    tasks.sort((a, b) => (b.notifyAt - a.notifyAt));
    container.innerHTML = '';
    if (tasks.length === 0) {
      container.textContent = 'No completed tasks.';
      return;
    }
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.style.cssText = 'margin-bottom: 12px; padding: 10px; background: #2D4A53; border-radius: 12px; color: #AFB3B7;';
      taskDiv.innerHTML = `<div style="font-weight:bold;">${task.description}</div><div style="color:#AFB3B7; font-size:13px; margin-top:4px;">Completed</div>`;
      container.appendChild(taskDiv);
    });
  });
}

function renderPendingTasks(container) {
  chrome.storage.local.get(['tasks'], (result) => {
    let tasks = (result.tasks || []).filter(t => t.status === 'pending');
    tasks.sort((a, b) => (b.extraTime || 0) - (a.extraTime || 0));
    container.innerHTML = '';
    if (tasks.length === 0) {
      container.textContent = 'No pending tasks.';
      return;
    }
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.style.cssText = 'margin-bottom: 12px; padding: 10px; background: #2D4A53; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; color: #AFB3B7;';
      let extraTimeStr = '';
      if (task.extraTime) {
        const totalSeconds = Math.floor(task.extraTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        extraTimeStr = `&nbsp;<span style=\"color:#888; font-size:12px;\">(Extra time taken: ${minutes}m ${seconds}s)</span>`;
      }
      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `<div style=\"font-weight:bold; color:#AFB3B7;\">${task.description}${extraTimeStr}</div><div style=\"color:#e53935; font-size:13px; margin-top:4px;\">Pending!!</div>`;
      // Add Completed? button
      const completeBtn = document.createElement('button');
      completeBtn.textContent = 'Completed?';
      completeBtn.style.cssText = 'background:#43a047; color:white; border:none; border-radius:4px; padding:6px 14px; font-weight:bold; cursor:pointer; font-size:13px; margin-left:12px;';
      completeBtn.onclick = () => {
        chrome.storage.local.get(['tasks'], (result) => {
          let allTasks = result.tasks || [];
          const idx = allTasks.findIndex(t => t.id === task.id);
          if (idx !== -1) {
            allTasks[idx].status = 'completed';
            chrome.storage.local.set({ tasks: allTasks }, () => {
              renderPendingTasks(container);
              const completedTab = document.querySelector('.manage-tasks-completed-tab');
              if (completedTab) renderCompletedTasks(completedTab);
            });
          }
        });
      };
      taskDiv.appendChild(infoDiv);
      taskDiv.appendChild(completeBtn);
      container.appendChild(taskDiv);
    });
  });
}

function showAlarmPopup(task) {
  if (alarmPopup) {
    alarmPopup.remove();
    alarmPopup = null;
    if (alarmPopupTimeout) clearTimeout(alarmPopupTimeout);
  }
  alarmPopup = document.createElement('div');
  alarmPopup.style.cssText = `
    position: fixed;
    min-width: 320px;
    max-width: 400px;
    background: rgba(13,31,35,0.96);
    border-radius: 22px;
    box-shadow: 0 8px 32px 0 rgba(13,31,35,0.37);
    border: 1.5px solid #2D4A53;
    padding: 28px 28px 18px 28px;
    z-index: 2147483650;
    font-family: 'Segoe UI', Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: #AFB3B7;
  `;
  
  // Title
  const title = document.createElement('div');
  title.textContent = 'Did you complete the task:';
  title.style.cssText = 'font-size: 18px; font-weight: bold; margin-bottom: 10px;';
  alarmPopup.appendChild(title);
  
  // Description
  const desc = document.createElement('div');
  desc.textContent = task.description;
  desc.style.cssText = 'font-size: 16px; margin-bottom: 18px;';
  alarmPopup.appendChild(desc);
  
  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display: flex; gap: 16px; width: 100%;';
  
  // Yes button
  const yesBtn = document.createElement('button');
  yesBtn.textContent = 'Yes';
  yesBtn.style.cssText = 'background:#43a047; color:white; border:none; border-radius:4px; padding:10px 24px; font-weight:bold; cursor:pointer; font-size:15px;';
  yesBtn.onclick = () => {
    updateTaskStatus(task.id, 'completed');
    closeAlarmPopup();
  };
  
  // No button
  const noBtn = document.createElement('button');
  noBtn.textContent = 'No';
  noBtn.style.cssText = 'background:#e53935; color:white; border:none; border-radius:4px; padding:10px 24px; font-weight:bold; cursor:pointer; font-size:15px;';
  noBtn.onclick = () => {
    updateTaskStatus(task.id, 'pending');
    closeAlarmPopup();
  };
  
  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  alarmPopup.appendChild(btnRow);
  document.body.appendChild(alarmPopup);
  
  // Position the popup next to the sprite
  positionPopup(alarmPopup, 340);
  
  // Auto-close after 1 minute and move to pending if not responded
  alarmPopupTimeout = setTimeout(() => {
    updateTaskStatus(task.id, 'pending');
    closeAlarmPopup();
  }, 60000);
}

function closeAlarmPopup() {
  if (alarmPopup) {
    alarmPopup.remove();
    alarmPopup = null;
  }
  if (alarmPopupTimeout) {
    clearTimeout(alarmPopupTimeout);
    alarmPopupTimeout = null;
  }
}

function updateTaskStatus(taskId, status) {
  chrome.storage.local.get(['tasks'], (result) => {
    let allTasks = result.tasks || [];
    const idx = allTasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      if (status === 'completed') {
        allTasks[idx].status = 'completed';
      } else if (status === 'pending') {
        allTasks[idx].status = 'pending';
        allTasks[idx].pendingReason = 'No response to alarm popup';
        allTasks[idx].extraTime = Date.now() - (allTasks[idx].notifyAt || Date.now());
      }
      chrome.storage.local.set({ tasks: allTasks });
    }
  });
}

function setTaskPopupSaveHandler() {
  const saveBtn = taskPopup.querySelector('button');
  // Remove previous handler if it exists
  if (currentTaskPopupHandler) {
    saveBtn.removeEventListener('click', currentTaskPopupHandler);
  }
  // Define the new handler
  currentTaskPopupHandler = function(e) {
    e.stopPropagation();
    const taskDescription = taskInput.value.trim();
    const taskDate = dateInput.value;
    const taskTime = timeInput.value;

    if (taskDescription === '') {
      alert('Please enter a task description');
      return;
    }
    if (!taskDate || !taskTime) {
      alert('Please enter a valid date and time');
      return;
    }
    // Combine date and time into a timestamp
    const notifyAt = new Date(`${taskDate}T${taskTime}`).getTime();
    if (isNaN(notifyAt) || notifyAt < Date.now()) {
      alert('Please enter a future date and time');
      return;
    }

    if (isEditMode && editTaskId !== null) {
      // Edit mode: update existing task
      chrome.storage.local.get(['tasks'], (result) => {
        let tasks = result.tasks || [];
        const idx = tasks.findIndex(t => t.id === editTaskId);
        if (idx !== -1) {
          tasks[idx].description = taskDescription;
          tasks[idx].date = taskDate;
          tasks[idx].time = taskTime;
          tasks[idx].notifyAt = notifyAt;
          chrome.storage.local.set({ tasks }, () => {
            isEditMode = false;
            editTaskId = null;
            taskInput.value = '';
            dateInput.value = new Date().toISOString().split('T')[0];
            const now = new Date();
            timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            hideTaskPopup();
            if (manageTasksPopup) {
              const ongoingContent = manageTasksPopup.querySelector('div:nth-child(5)');
              if (ongoingContent) renderOngoingTasks(ongoingContent);
            }
          });
        }
      });
    } else {
      // Normal add mode
      const task = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        description: taskDescription,
        date: taskDate,
        time: taskTime,
        status: 'ongoing',
        notifyAt
      };
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        tasks.push(task);
        chrome.storage.local.set({ tasks }, () => {
          chrome.runtime.sendMessage({ action: 'scheduleTaskNotification', task });
          taskInput.value = '';
          dateInput.value = new Date().toISOString().split('T')[0];
          const now = new Date();
          timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          hideTaskPopup();
        });
      });
    }
  };
  // Add the new handler
  saveBtn.addEventListener('click', currentTaskPopupHandler);
}

function showChatPopup() {
  if (chatPopup) {
    chatPopup.style.display = 'block';
    positionPopup(chatPopup, 340);
    isChatPopupOpen = true;
    loadChatMessages();
    setTimeout(() => { chatInput.focus(); }, 100);
  }
}

function hideChatPopup() {
  if (chatPopup) {
    chatPopup.style.display = 'none';
    isChatPopupOpen = false;
  }
}

function loadChatMessages() {
  chrome.storage.local.get(['chatMessages'], (result) => {
    const messages = result.chatMessages || [];
    chatMessagesArea.innerHTML = '';
    messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.style.cssText = `margin-bottom: 2px; display: flex; flex-direction: column; align-items: ${msg.sender === 'user' ? 'flex-end' : 'flex-start'};`;
      const bubble = document.createElement('div');
      bubble.textContent = msg.text;
      bubble.style.cssText = `max-width: 80%; padding: 8px 14px; border-radius: 14px; background: ${msg.sender === 'user' ? '#AFB3B7' : '#69818D'}; color: ${msg.sender === 'user' ? '#0D1F23' : '#fff'}; font-size: 15px; margin-bottom: 2px;`;
      msgDiv.appendChild(bubble);
      chatMessagesArea.appendChild(msgDiv);
    });
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
  });
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chrome.storage.local.get(['chatMessages'], (result) => {
    const messages = result.chatMessages || [];
    messages.push({ sender: 'user', text });
    chrome.storage.local.set({ chatMessages: messages }, () => {
      chatInput.value = '';
      loadChatMessages();
      setTimeout(() => { generateBotReply(text); }, 400);
    });
  });
}

async function generateBotReply(userText) {
  // Show loading message
  chrome.storage.local.get(['chatMessages'], (result) => {
    const messages = result.chatMessages || [];
    messages.push({ sender: 'bot', text: '...' });
    chrome.storage.local.set({ chatMessages: messages }, loadChatMessages);
  });

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }]
      })
    });
    const data = await res.json();
    console.log('API Response:', data); // Log the API response for debugging
    let reply = 'Sorry, I could not get a response.';
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
      reply = data.candidates[0].content.parts[0].text;
    }
    // Remove the loading message and add the real reply
    chrome.storage.local.get(['chatMessages'], (result) => {
      let messages = result.chatMessages || [];
      // Remove last '...' if present
      if (messages.length && messages[messages.length-1].text === '...') {
        messages.pop();
      }
      messages.push({ sender: 'bot', text: reply });
      chrome.storage.local.set({ chatMessages: messages }, loadChatMessages);
    });
  } catch (err) {
    console.error('Error fetching from Gemini API:', err); // Log the error for debugging
    // Remove the loading message and show error
    chrome.storage.local.get(['chatMessages'], (result) => {
      let messages = result.chatMessages || [];
      if (messages.length && messages[messages.length-1].text === '...') {
        messages.pop();
      }
      messages.push({ sender: 'bot', text: 'Error: Could not connect to Gemini API.' });
      chrome.storage.local.set({ chatMessages: messages }, loadChatMessages);
    });
  }
}

// Function to check for tasks that are past their alarm time and move them to pending (no popup)
function checkPastTasks() {
  chrome.storage.local.get(['tasks'], (result) => {
    let tasks = result.tasks || [];
    const now = Date.now();
    let changed = false;
    tasks.forEach(task => {
      if (task.status === 'ongoing' && task.notifyAt <= now) {
        task.status = 'pending';
        task.pendingReason = 'Missed while extension was off';
        task.extraTime = now - (task.notifyAt || now);
        changed = true;
      }
    });
    if (changed) {
      chrome.storage.local.set({ tasks });
    }
  });
}

// Create sprite as soon as content script loads
createSpriteContainer(); 