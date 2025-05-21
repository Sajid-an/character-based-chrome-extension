// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Interactive Sprite Character extension installed");
  // Set initial state to disabled
  chrome.storage.local.set({ isEnabled: false }, function() {
    updateIcon(false);
  });
  // Set up a repeating alarm to clear completed tasks every 12 hours
  chrome.alarms.create('clearCompletedTasks', { periodInMinutes: 720 }); // 12 hours
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Toggle the extension state
  chrome.storage.local.get(['isEnabled'], function(result) {
    const isEnabled = !result.isEnabled;
    chrome.storage.local.set({ isEnabled: isEnabled }, function() {
      updateIcon(isEnabled);
      if (isEnabled) {
        // When enabled, inject into all existing tabs
        injectIntoAllTabs();
      } else {
        // When disabled, remove from all tabs
        removeFromAllTabs();
      }
    });
  });
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  // Check if extension is enabled before injecting
  chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.isEnabled) {
      // Wait for the tab to be fully loaded
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          injectIntoNewTab(tab.id);
          // Remove the listener after injection
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
  });
});

// Listen for messages from content script to schedule task notifications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scheduleTaskNotification' && message.task) {
    const { id, description, notifyAt } = message.task;
    // Create an alarm for the task
    chrome.alarms.create(`task_${id}`, { when: notifyAt });
    // Optionally, store the task id/description for notification use
  }
});

// Listen for alarms and show notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'clearCompletedTasks') {
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      tasks = tasks.filter(t => t.status !== 'completed');
      chrome.storage.local.set({ tasks });
    });
    return;
  }
  if (alarm.name.startsWith('task_')) {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const taskId = alarm.name.replace('task_', '');
      const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
      if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        // Send a message to the active tab to show the custom alarm popup
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'showAlarmPopup', task });
          }
        });
        // Store the time the alarm was triggered
        tasks[taskIndex].notifiedAt = Date.now();
        chrome.storage.local.set({ tasks });
      }
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (!notifId.startsWith('reminder_')) return;
  const taskId = notifId.replace('reminder_', '');
  chrome.storage.local.get(['tasks'], (result) => {
    const tasks = result.tasks || [];
    const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
    if (taskIndex === -1) return;
    if (btnIdx === 0) {
      // Yes: move to completed
      tasks[taskIndex].status = 'completed';
      chrome.storage.local.set({ tasks });
    } else if (btnIdx === 1) {
      // No: move to pending, record extra time
      tasks[taskIndex].status = 'pending';
      tasks[taskIndex].pendingReason = 'User did not complete on time';
      tasks[taskIndex].extraTime = Date.now() - (tasks[taskIndex].notifyAt || Date.now());
      chrome.storage.local.set({ tasks });
    }
    // Optionally clear the notification
    chrome.notifications.clear(notifId);
  });
});

// Function to update the extension icon
function updateIcon(isEnabled) {
  const iconPath = isEnabled ? "icon.png" : "icon_disabled.png";
  chrome.action.setIcon({ path: iconPath });
}

// Function to inject content script and styles into a new tab
function injectIntoNewTab(tabId) {
  // First inject the styles
  chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['styles.css']
  }).then(() => {
    // Then inject the content script
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }).then(() => {
    console.log(`Content script and styles injected into new tab ${tabId}`);
  }).catch(error => {
    console.error(`Error injecting into new tab ${tabId}:`, error);
  });
}

// Function to inject content script into all tabs
function injectIntoAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      // First inject the styles
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css']
      }).then(() => {
        // Then inject the content script
        return chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
    }).then(() => {
        console.log(`Content script and styles injected successfully into tab ${tab.id}`);
    }).catch(error => {
        console.error(`Error injecting into tab ${tab.id}:`, error);
    });
    });
  });
}

// Function to remove content script from all tabs
function removeFromAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'removeSprite' });
    });
  });
}

// Check extension state when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['isEnabled'], function(result) {
      if (result.isEnabled) {
        injectIntoNewTab(tabId);
      }
    });
  }
}); 

// Also set the alarm when the extension starts (in case it was reloaded)
chrome.alarms.create('clearCompletedTasks', { periodInMinutes: 720 }); 