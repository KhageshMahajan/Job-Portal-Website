<script>
  (() => {
    // Data persistence keys
    const STORAGE_JOBS = 'ajp_jobs';
    const STORAGE_APPLICATIONS = 'ajp_applications';
    const STORAGE_USERS = 'ajp_users';
    const STORAGE_SESSION = 'ajp_session';
    const STORAGE_THEME = 'ajp_theme';

    // Default jobs data if none in localStorage
    const DEFAULT_JOBS = [
      {
        id: 1,
        title: "Software Developer Intern",
        company: "Tech Innovations Ltd.",
        location: "remote",
        type: "internship",
        description: "Work on real world projects, learn new tech stacks, and enhance your development skills.",
        datePosted: '2024-06-01'
      },
      {
        id: 2,
        title: "Part-time Graphic Designer",
        company: "Creative Minds",
        location: "on-campus",
        type: "part-time",
        description: "Design brochures, posters and social media content for college events and external clients.",
        datePosted: '2024-05-15'
      },
      {
        id: 3,
        title: "Full-time Data Analyst",
        company: "Data Insights Inc.",
        location: "city-center",
        type: "full-time",
        description: "Analyze large datasets and generate actionable insights for business stakeholders.",
        datePosted: '2024-04-25'
      },
      {
        id: 4,
        title: "Remote Content Writer",
        company: "Bright Words Agency",
        location: "remote",
        type: "remote",
        description: "Create engaging blog posts, articles and marketing content for various clients.",
        datePosted: '2024-05-29'
      },
      {
        id: 5,
        title: "Full-time Campus Ambassador",
        company: "Innovate Your Future",
        location: "on-campus",
        type: "full-time",
        description: "Act as a liaison between the company and the college, promote the brand and events.",
        datePosted: '2024-04-10'
      }
    ];

    // Add default user accounts (username:admin,password:admin123; username:user,password:user123)
    const DEFAULT_USERS = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' }
    ];

    // Elements
    const jobsSection = document.getElementById('jobs');
    const applicationsSection = document.getElementById('my-applications');
    const applicationsList = document.getElementById('applications-list');
    const adminPanel = document.getElementById('admin-panel');
    const adminJobForm = document.getElementById('admin-job-form');
    const adminJobList = document.getElementById('admin-job-list');
    const themeToggleBtn = document.getElementById('btn-toggle-theme');
    const loginBtn = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');
    const adminBtn = document.getElementById('btn-admin');
    const searchInput = document.getElementById('search-input');
    const filterType = document.getElementById('filter-type');
    const filterLocation = document.getElementById('filter-location');
    const sortBy = document.getElementById('sort-by');
    const clearFiltersBtn = document.getElementById('btn-clear-filters');

    // Modals
    const jobModal = document.getElementById('job-modal');
    const jobModalClose = document.getElementById('modal-close');
    const jobModalTitle = document.getElementById('job-modal-title');
    const jobModalCompany = document.getElementById('job-modal-company');
    const jobModalLocation = document.getElementById('job-modal-location');
    const jobModalType = document.getElementById('job-modal-type');
    const jobModalDesc = document.getElementById('job-modal-desc');
    const applyJobBtn = document.getElementById('btn-apply-job');

    const applyModal = document.getElementById('apply-modal');
    const applyModalClose = document.getElementById('apply-modal-close');
    const applicationForm = document.getElementById('application-form');

    const loginModal = document.getElementById('login-modal');
    const loginModalClose = document.getElementById('login-modal-close');
    const loginForm = document.getElementById('login-form');

    const toast = document.getElementById('toast');

    // State
    let jobs = [];
    let applications = [];
    let users = [];
    let session = null; // {username, role}
    let filteredJobs = [];
    let currentViewedJobId = null;
    let currentAppliedJobId = null;
    let editingJobId = null;

    /** Utils **/

    // Save/load from localStorage
    function saveToStorage(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    function loadFromStorage(key) {
      const val = localStorage.getItem(key);
      if(!val) return null;
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    // Escape HTML entities for safe display
    function escapeHtml(text) {
      if(!text) return '';
      return text.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
    }
    // Format job type
    function formatJobType(type) {
      switch(type) {
        case 'full-time': return 'Full-time';
        case 'part-time': return 'Part-time';
        case 'internship': return 'Internship';
        case 'remote': return 'Remote';
        default: return type;
      }
    }
    // Format location
    function formatLocation(loc) {
      switch(loc) {
        case 'remote': return 'Remote';
        case 'on-campus': return 'On-campus';
        case 'city-center': return 'City Center';
        default: return loc;
      }
    }
    // Show toast message
    let toastTimeout = null;
    function showToast(message, duration = 3500) {
      toast.textContent = message;
      toast.classList.add('show');
      if(toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
    // Generates new job id
    function generateJobId() {
      return jobs.reduce((maxId, job) => Math.max(maxId, job.id), 0) + 1;
    }
    // Generates new application id
    function generateAppId() {
      return applications.reduce((maxId, app) => Math.max(maxId, app.id), 0) + 1;
    }
    // Save all data to storage
    function saveAllData() {
      saveToStorage(STORAGE_JOBS, jobs);
      saveToStorage(STORAGE_APPLICATIONS, applications);
      saveToStorage(STORAGE_USERS, users);
      saveToStorage(STORAGE_SESSION, session);
    }
    // Clear all inputs of admin job form
    function clearAdminJobForm() {
      adminJobForm.reset();
      editingJobId = null;
      document.getElementById('admin-job-id').value = '';
      adminJobForm.querySelector('button[type="submit"]').textContent = 'Save Job';
    }
    /** Authentication **/

    // Load users or default users (admin + normal user)
    function initUsers() {
      users = loadFromStorage(STORAGE_USERS);
      if(!users || users.length === 0) {
        users = [...DEFAULT_USERS];
        saveToStorage(STORAGE_USERS, users);
      }
    }
    // Attempt login
    function login(username, password) {
      const user = users.find(u => u.username === username && u.password === password);
      if(user) {
        session = { username: user.username, role: user.role };
        saveToStorage(STORAGE_SESSION, session);
        showToast(`Welcome ${user.username}!`);
        updateUIForAuthentication();
        return true;
      } else {
        showToast('Invalid username or password');
        return false;
      }
    }
    // Logout
    function logout() {
      session = null;
      saveToStorage(STORAGE_SESSION, null);
      showToast('Logged out');
      updateUIForAuthentication();
    }
    // Update UI based on authentication state
    function updateUIForAuthentication() {
      if(session) {
        loginBtn.hidden = true;
        logoutBtn.hidden = false;
        if(session.role === 'admin') {
          adminBtn.hidden = false;
          showAdminPanel(false);
        } else {
          adminBtn.hidden = true;
          hideAdminPanel();
        }
        // Show applications section for logged-in users
        applicationsSection.hidden = false;
        loadAndRenderApplications();
      } else {
        loginBtn.hidden = false;
        logoutBtn.hidden = true;
        adminBtn.hidden = true;
        hideAdminPanel();
        applicationsSection.hidden = true;
      }
    }
    /** Theme **/
    function loadTheme() {
      let theme = localStorage.getItem(STORAGE_THEME) || 'light';
      applyTheme(theme);
      return theme;
    }
    function applyTheme(theme) {
      if(theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️';
      } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙';
      }
      localStorage.setItem(STORAGE_THEME, theme);
    }
    /** Jobs Rendering **/

    // Render jobs to the jobsSection based on filter, search and sort
    function renderJobs() {
      // Filter by type, location, searchTerm
      const typeFilter = filterType.value;
      const locFilter = filterLocation.value;
      const searchTerm = searchInput.value.trim().toLowerCase();
      const sortVal = sortBy.value;

      filteredJobs = jobs.filter(job => {
        let typeMatch = (typeFilter === 'all') || (job.type === typeFilter);
        let locMatch = (locFilter === 'all') || (job.location === locFilter);
        let searchMatch = 
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm);
        return typeMatch && locMatch && searchMatch;
      });

      // Sort
      filteredJobs.sort((a, b) => {
        switch(sortVal){
          case 'date-desc': return new Date(b.datePosted) - new Date(a.datePosted);
          case 'date-asc': return new Date(a.datePosted) - new Date(b.datePosted);
          case 'title-asc': return a.title.localeCompare(b.title);
          case 'title-desc': return b.title.localeCompare(a.title);
          default: return 0;
        }
      });

      jobsSection.innerHTML = '';
      if(filteredJobs.length === 0) {
        jobsSection.innerHTML = '<p style="color:var(--text); font-style: italic;">No jobs found matching your criteria.</p>';
        return;
      }

      filteredJobs.forEach(job => {
        const card = document.createElement('article');
        card.setAttribute('tabindex', '0');
        card.className = 'job-card';
        card.innerHTML = `
          <div class="job-header">
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
            <p class="job-type">${formatJobType(job.type)}</p>
          </div>
          <p class="company-name">${escapeHtml(job.company)}</p>
          <p class="location">${formatLocation(job.location)}</p>
          <p class="job-description">${escapeHtml(job.description)}</p>
          <div class="btn-group">
            <button class="btn btn-view" data-jobid="${job.id}" aria-label="View details for ${escapeHtml(job.title)}">Details</button>
            <button class="btn btn-save" data-jobid="${job.id}" aria-label="Save job ${escapeHtml(job.title)}">Save</button>
          </div>
        `;
        jobsSection.appendChild(card);
      });
    }

    /** Applications Rendering **/
    function loadAndRenderApplications() {
      if(!session) {
        applicationsSection.hidden = true;
        return;
      }
      applicationsSection.hidden = false;
      const userApplications = applications.filter(app => app.username === session.username);

      applicationsList.innerHTML = '';
      if(userApplications.length === 0) {
        applicationsList.innerHTML = '<p style="font-style: italic;">You have no job applications yet.</p>';
        return;
      }
      userApplications.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        if(!job) return; // skip if job deleted
        const div = document.createElement('div');
        div.className = 'job-card';
        div.style.background = 'var(--card-bg)';
        div.innerHTML = `
          <h4>${escapeHtml(job.title)}</h4>
          <p><strong>Company:</strong> ${escapeHtml(job.company)}</p>
          <p><strong>Status:</strong> ${escapeHtml(app.status)}</p>
          <p><strong>Applied on:</strong> ${new Date(app.dateApplied).toLocaleDateString()}</p>
          <details>
            <summary>Application Message</summary>
            <p>${escapeHtml(app.message || '')}</p>
          </details>
        `;
        applicationsList.appendChild(div);
      });
    }

    /** Saved Jobs **/

    function getSavedJobs() {
      if(!session) return [];
      const key = `ajp_saved_${session.username}`;
      const saved = loadFromStorage(key);
      if(Array.isArray(saved)) return saved;
      return [];
    }
    function setSavedJobs(savedJobs) {
      if(!session) return;
      const key = `ajp_saved_${session.username}`;
      saveToStorage(key, savedJobs);
    }
    function toggleSaveJob(jobId, btn) {
      if(!session) { showToast('You must be logged in to save jobs.'); return; }
      const saved = getSavedJobs();
      const idx = saved.indexOf(jobId);
      if(idx >= 0) {
        saved.splice(idx,1);
        btn.textContent = 'Save';
        showToast('Job removed from saved');
      } else {
        saved.push(jobId);
        btn.textContent = 'Saved';
        showToast('Job saved');
      }
      setSavedJobs(saved);
    }
    function updateSaveButtons() {
      if(!session) return;
      const saved = getSavedJobs();
      document.querySelectorAll('.btn-save').forEach(btn => {
        const jid = parseInt(btn.getAttribute('data-jobid'),10);
        if(saved.includes(jid)) {
          btn.textContent = 'Saved';
        } else {
          btn.textContent = 'Save';
        }
      });
    }

    /** Event Listeners **/

    // Filter change and search button
    searchInput.addEventListener('input', () => renderJobs());
    filterType.addEventListener('change', () => renderJobs());
    filterLocation.addEventListener('change', () => renderJobs());
    sortBy.addEventListener('change', () => renderJobs());
    clearFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterType.value = 'all';
      filterLocation.value = 'all';
      sortBy.value = 'date-desc';
      renderJobs();
    });

    // Delegated buttons on job listings
    jobsSection.addEventListener('click', e => {
      if(e.target.classList.contains('btn-view')) {
        const jobId = parseInt(e.target.getAttribute('data-jobid'), 10);
        showJobModal(jobId);
      } else if(e.target.classList.contains('btn-save')) {
        if(!session) {
          showToast('Please login to save jobs.');
          return;
        }
        const jobId = parseInt(e.target.getAttribute('data-jobid'), 10);
        toggleSaveJob(jobId, e.target);
      }
    });

    // Job modal buttons
    jobModalClose.addEventListener('click', () => closeModal(jobModal));
    applyJobBtn.addEventListener('click', () => {
      closeModal(jobModal);
      if(!session) {
        showToast('Please login to apply for jobs.');
        openModal(loginModal);
        return;
      }
      openApplyModal(currentViewedJobId);
    });

    // Apply modal close
    applyModalClose.addEventListener('click', () => closeModal(applyModal));
    // Application form submission
    applicationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!applicationForm.checkValidity()) {
        applicationForm.reportValidity();
        return;
      }
      if(!session) {
        showToast('Please login first.');
        closeModal(applyModal);
        return;
      }
      const formData = new FormData(applicationForm);
      const name = formData.get('name').trim();
      const email = formData.get('email').trim();
      const message = formData.get('message').trim();
      const resumeFile = formData.get('resume');

      // Validate resume file extension (if provided)
      if(resumeFile && resumeFile.name) {
        const allowedExt = ['pdf','doc','docx'];
        const ext = resumeFile.name.split('.').pop().toLowerCase();
        if(!allowedExt.includes(ext)) {
          showToast('Resume must be PDF, DOC, or DOCX');
          return;
        }
      }

      // Save application
      applications.push({
        id: generateAppId(),
        jobId: currentAppliedJobId,
        username: session.username,
        name,
        email,
        message,
        resumeName: resumeFile && resumeFile.name ? resumeFile.name : null,
        status: 'Submitted',
        dateApplied: new Date().toISOString()
      });
      saveToStorage(STORAGE_APPLICATIONS, applications);
      showToast('Application submitted successfully!');
      closeModal(applyModal);
      loadAndRenderApplications();
    });

    // Login modal open/close
    loginBtn.addEventListener('click', () => openModal(loginModal));
    loginModalClose.addEventListener('click', () => closeModal(loginModal));

    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = loginForm.elements['username'].value.trim();
      const password = loginForm.elements['password'].value.trim();
      if(login(username, password)) {
        closeModal(loginModal);
      }
    });

    // Logout action
    logoutBtn.addEventListener('click', () => logout());

    // Admin panel toggle
    adminBtn.addEventListener('click', () => {
      if(adminPanel.hidden) {
        showAdminPanel(true);
      } else {
        hideAdminPanel();
      }
    });

    // Admin job form submit
    adminJobForm.addEventListener('submit', e => {
      e.preventDefault();
      if(!session || session.role !== 'admin') {
        showToast('Unauthorized');
        hideAdminPanel();
        return;
      }
      const idVal = document.getElementById('admin-job-id').value;
      const title = document.getElementById('admin-job-title').value.trim();
      const company = document.getElementById('admin-job-company').value.trim();
      const location = document.getElementById('admin-job-location').value;
      const type = document.getElementById('admin-job-type').value;
      const description = document.getElementById('admin-job-description').value.trim();

      if(!title || !company || !location || !type || !description) {
        showToast('Please fill out all fields.');
        return;
      }
      if(idVal) {
        // Edit existing job
        const jobId = parseInt(idVal, 10);
        const job = jobs.find(j => j.id === jobId);
        if(job) {
          job.title = title;
          job.company = company;
          job.location = location;
          job.type = type;
          job.description = description;
          showToast('Job updated successfully');
        }
      } else {
        // Add new job
        jobs.push({
          id: generateJobId(),
          title,
          company,
          location,
          type,
          description,
          datePosted: new Date().toISOString().slice(0,10)
        });
        showToast('Job added successfully');
      }
      saveToStorage(STORAGE_JOBS, jobs);
      clearAdminJobForm();
      renderJobs();
      renderAdminJobList();
    });

    // Admin cancel edit
    document.getElementById('btn-cancel-edit').addEventListener('click', e => {
      e.preventDefault();
      clearAdminJobForm();
    });

    // Admin job list actions (edit, delete)
    adminJobList.addEventListener('click', e => {
      if(e.target.classList.contains('admin-edit')) {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        editJob(id);
      } else if(e.target.classList.contains('admin-delete')) {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        if(confirm('Are you sure you want to delete this job posting?')) {
          jobs = jobs.filter(j => j.id !== id);
          saveToStorage(STORAGE_JOBS, jobs);
          renderJobs();
          renderAdminJobList();
          showToast('Job deleted');
        }
      }
    });

    // Theme toggle button
    themeToggleBtn.addEventListener('click', () => {
      let currentTheme = document.documentElement.getAttribute('data-theme');
      if(currentTheme === 'dark') {
        applyTheme('light');
      } else {
        applyTheme('dark');
      }
    });

    /** Modals **/

    // Generic open/close modal functions
    function openModal(modal) {
      modal.classList.add('active');
      // Focus first input or button in modal for accessibility
      setTimeout(() => {
        const focusable = modal.querySelector('input, button, textarea, select');
        if(focusable) focusable.focus();
      }, 100);
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
    }
    function closeModal(modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Close modals on ESC key
    window.addEventListener('keydown', e => {
      if(e.key === 'Escape') {
        [jobModal, applyModal, loginModal].forEach(modal => {
          if(modal.classList.contains('active')) closeModal(modal);
        });
      }
    });

    // Job modal display
    function showJobModal(jobId) {
      currentViewedJobId = jobId;
      const job = jobs.find(j => j.id === jobId);
      if(!job) return;
      jobModalTitle.textContent = job.title;
      jobModalCompany.textContent = job.company;
      jobModalLocation.textContent = formatLocation(job.location);
      jobModalType.textContent = formatJobType(job.type);
      jobModalDesc.textContent = job.description;
      openModal(jobModal);
    }

    // Open apply modal for specific job
    function openApplyModal(jobId) {
      currentAppliedJobId = jobId;
      applicationForm.reset();
      openModal(applyModal);
    }

    /** Admin Panel **/

    function showAdminPanel(open = true) {
      adminPanel.hidden = !open;
      if(open) {
        clearAdminJobForm();
        renderAdminJobList();
      }
    }
    function hideAdminPanel() {
      adminPanel.hidden = true;
    }
    function renderAdminJobList() {
      adminJobList.innerHTML = '';
      if(jobs.length === 0) {
        adminJobList.innerHTML = '<p>No job postings available.</p>';
        return;
      }
      jobs.forEach(job => {
        const div = document.createElement('div');
        div.style.background = 'var(--card-bg)';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '0.7rem';
        div.innerHTML = `
          <strong>${escapeHtml(job.title)}</strong><br/>
          ${escapeHtml(job.company)} - ${formatLocation(job.location)} - ${formatJobType(job.type)}<br/>
          <button class="btn outline admin-edit" data-id="${job.id}">Edit</button>
          <button class="btn outline admin-delete" data-id="${job.id}">Delete</button>
        `;
        adminJobList.appendChild(div);
      });
    }
    function editJob(id) {
      const job = jobs.find(j => j.id === id);
      if(!job) return;
      editingJobId = id;
      document.getElementById('admin-job-id').value = id;
      document.getElementById('admin-job-title').value = job.title;
      document.getElementById('admin-job-company').value = job.company;
      document.getElementById('admin-job-location').value = job.location;
      document.getElementById('admin-job-type').value = job.type;
      document.getElementById('admin-job-description').value = job.description;
      adminJobForm.querySelector('button[type="submit"]').textContent = 'Update Job';
      if(adminPanel.hidden) adminPanel.hidden = false;
      adminJobForm.scrollIntoView({behavior: 'smooth'});
    }

    /** Initialization **/

    // Load saved jobs/applications/users/session from storage
    function loadAllData() {
      jobs = loadFromStorage(STORAGE_JOBS) || DEFAULT_JOBS;
      applications = loadFromStorage(STORAGE_APPLICATIONS) || [];
      initUsers();
      session = loadFromStorage(STORAGE_SESSION);
    }

    // Initial Setup
    loadAllData();
    updateUIForAuthentication();
    renderJobs();

    // After rendering jobs, mark saved buttons
    setTimeout(() => updateSaveButtons(), 200);

    // Apply saved theme
    loadTheme();

  })();
</script>
