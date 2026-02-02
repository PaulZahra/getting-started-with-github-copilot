document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
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

        // Build participants list HTML
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `
                  <li class="participant-item" data-activity="${name}" data-email="${email}">
                    <span class="participant-email">${email}</span>
                    <span class="delete-participant" title="Remove participant" style="cursor:pointer; color:#c62828; margin-left:8px; font-size:18px;">&#128465;</span>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section no-participants">
              <em>No participants yet</em>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add delete event listeners after rendering
        setTimeout(() => {
          activityCard
            .querySelectorAll(".delete-participant")
            .forEach((icon) => {
              icon.addEventListener("click", function (e) {
                const li = this.closest(".participant-item");
                const participantEmail = li.getAttribute("data-email");
                const activityName = li.getAttribute("data-activity");
                showDeleteConfirmation(activityName, participantEmail, li);
              });
            });
        }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  // Delete confirmation popup
  function showDeleteConfirmation(
    activityName,
    participantEmail,
    participantLi,
  ) {
    // Remove any existing popup
    const existing = document.getElementById("delete-confirm-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.id = "delete-confirm-popup";
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100vw";
    popup.style.height = "100vh";
    popup.style.background = "rgba(0,0,0,0.3)";
    popup.style.display = "flex";
    popup.style.alignItems = "center";
    popup.style.justifyContent = "center";
    popup.style.zIndex = "9999";

    popup.innerHTML = `
      <div style="background:white;padding:24px 32px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);text-align:center;max-width:320px;">
        <p>Are you sure you want to remove <strong>${participantEmail}</strong> from <strong>${activityName}</strong>?</p>
        <button id="confirm-delete-btn" style="margin-right:12px;padding-top:4px">Yes</button>
        <button id="cancel-delete-btn" style="padding-top:4px">Cancel</button>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById("confirm-delete-btn").onclick = async function () {
      await unregisterParticipant(
        activityName,
        participantEmail,
        participantLi,
      );
      popup.remove();
    };
    document.getElementById("cancel-delete-btn").onclick = function () {
      popup.remove();
    };
  }

  // Unregister participant (frontend only, backend call needed)
  async function unregisterParticipant(
    activityName,
    participantEmail,
    participantLi,
  ) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participantEmail)}`,
        {
          method: "POST",
        },
      );
      const result = await response.json();
      if (response.ok) {
        participantLi.remove();
        messageDiv.textContent = result.message || "Participant removed.";
        messageDiv.className = "success";
      } else {
        messageDiv.textContent =
          result.detail || "Failed to remove participant.";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  }
});
