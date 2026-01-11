document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const isFull = spotsLeft <= 0;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="activity-actions">
            <button class="register-btn" data-activity="${name}" ${isFull ? 'disabled' : ''}>
              ${isFull ? 'Activity Full' : 'Register Student'}
            </button>
            <div class="register-form" data-activity="${name}">
              <input type="email" class="email-input" placeholder="student-email@mergington.edu" required />
              <div class="register-form-buttons">
                <button class="submit-register-btn" data-activity="${name}">Sign Up</button>
                <button class="cancel-btn" data-activity="${name}">Cancel</button>
              </div>
            </div>
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegisterClick);
      });

      // Add event listeners to submit register buttons
      document.querySelectorAll(".submit-register-btn").forEach((button) => {
        button.addEventListener("click", handleRegisterSubmit);
      });

      // Add event listeners to cancel buttons
      document.querySelectorAll(".cancel-btn").forEach((button) => {
        button.addEventListener("click", handleRegisterCancel);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle register button click
  function handleRegisterClick(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const form = document.querySelector(`.register-form[data-activity="${activity}"]`);
    
    // Close all other open forms
    document.querySelectorAll(".register-form.active").forEach((f) => {
      if (f !== form) {
        f.classList.remove("active");
      }
    });
    
    form.classList.add("active");
    const emailInput = form.querySelector(".email-input");
    emailInput.focus();
  }

  // Handle register cancel
  function handleRegisterCancel(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const form = document.querySelector(`.register-form[data-activity="${activity}"]`);
    form.classList.remove("active");
    form.querySelector(".email-input").value = "";
  }

  // Handle register submit
  async function handleRegisterSubmit(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const form = document.querySelector(`.register-form[data-activity="${activity}"]`);
    const emailInput = form.querySelector(".email-input");
    const email = emailInput.value.trim();

    if (!email) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        form.classList.remove("active");
        emailInput.value = "";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  }

  // Show message helper function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
