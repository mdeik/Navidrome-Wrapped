// Main Application Controller
class NavidromeWrappedApp {
  constructor() {
    this.currentView = "login";
    this.stats = null;
    this.isDemo = false;
    this.cached = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form submission
    document
      .getElementById("generateBtn")
      .addEventListener("click", () => this.generateWrapped());
    // Demo button
    document
      .getElementById("demoBtn")
      .addEventListener("click", () => this.generateDemoWrapped());
    // Navigation between views
    document
      .getElementById("viewWrappedBtn")
      .addEventListener("click", () => this.showWrapped());
    document
      .getElementById("retryBtn")
      .addEventListener("click", () => this.showLogin());
  }

  // Add method to generate demo data
  generateDemoWrapped() {
    this.isDemo = true;
    this.setLoadingState(true);
    this.hideSections();

    // Simulate loading progress for demo
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress <= 100) {
        this.updateProgress(
          progress,
          "Generating demo data...",
          "Using sample music library"
        );
      } else {
        clearInterval(progressInterval);

        // Create comprehensive demo data
        this.stats = window.createDemoData();

        // Show results after a brief delay to simulate processing
        setTimeout(() => {
          this.setLoadingState(false);
          this.showResults();
        }, 500);
      }
    }, 100);
  }

  validateInputs(serverUrl, username, password) {
    if (!serverUrl || !username || !password) {
      this.showError(
        "Missing Information",
        "Please fill in all server details."
      );
      return false;
    }

    if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
      this.showError(
        "Invalid URL",
        "Please include http:// or https:// in your server URL."
      );
      return false;
    }

    return true;
  }

  setLoadingState(loading) {
    const generateBtn = document.getElementById("generateBtn");
    const btnText = generateBtn.querySelector(".btn-text");
    const btnLoading = generateBtn.querySelector(".btn-loading");

    generateBtn.disabled = loading;
    btnText.style.display = loading ? "none" : "inline";
    btnLoading.style.display = loading ? "block" : "none";
  }

  updateProgress(percent, message, details) {
    const percentInt = parseInt(percent);
    document.getElementById("progressFill").style.width = `${percent}%`;
    document.getElementById("progressPercent").textContent = `${percentInt}%`;
    document.getElementById("progressMessage").textContent = message;
    document.getElementById("progressDetails").textContent = details || "";
  }

  hideSections() {
    document.getElementById("resultsSection").style.display = "none";
    document.getElementById("errorSection").style.display = "none";
  }

  async generateWrapped() {
    const serverUrl = document.getElementById("serverUrl").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!this.validateInputs(serverUrl, username, password)) {
      return;
    }

    this.setLoadingState(true);
    this.hideSections();

    try {
      const api = new ClientSideND(serverUrl, username, password);

      // Test connection
      this.updateProgress(5, "Testing connection...", "Pinging server");
      const pong = await api._req("ping");
      if (!pong)
        throw new Error("Cannot reach server. Check your URL and credentials.");
      this.isDemo = false;
      // Generate stats with progress updates
      this.stats = await api.stats((percent, message, step, details) => {
        this.updateProgress(percent, message, details);
      });

      if (!this.stats.totalSongs)
        throw new Error("No music data found on your server");

      this.showResults();
    } catch (error) {
      this.showError("Generation Failed", error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  showResults() {
    const username = this.stats.username || "Unknown User";
    const isDemo = username === "Demo User";
    document.getElementById("quickStats").innerHTML = `
      <p>Generated for user: <strong>${username}</strong></p>
    ${
      isDemo
        ? '<p style="color: var(--accent-color); font-style: italic;">🎭 Demo Mode - Using Sample Data</p>'
        : ""
    }
    `;

    document.getElementById("resultsSection").style.display = "block";
    // Only make data persistent if not demo
    if (!this.isDemo) {
      saveWrap(this.stats);
    } else {
      localStorage.removeItem("navidrome_wrapped");
    }
  }

  showWrapped() {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("wrappedView").style.display = "block";
    const data = this.stats || cached; // newest first, cached results fallback
    if (!data) {
      this.showLogin();
      return;
    }
    new WrappedDisplay(data);
  }

  showLogin() {
    document.getElementById("wrappedView").style.display = "none";
    document.getElementById("loginView").style.display = "block";
    this.stats = null;

    // Reset form
    document.getElementById("serverUrl").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    this.hideSections();
  }

  showError(title, message) {
    document.getElementById("errorTitle").textContent = title;
    document.getElementById("errorMessage").textContent = message;
    document.getElementById("errorSection").style.display = "block";
  }
}

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.navidromeApp = new NavidromeWrappedApp();
});
