// Global variables
let nbfcData = [];
let scamHistory = [];
const localStorageKey = 'loanLegitimacyHistory';

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize dark mode
  initDarkMode();

  // Load NBFC data
  loadNBFCData();
  
  // Load scam history from localStorage
  loadScamHistory();
  
  // Set up form submission handler
  document.getElementById('loanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateLoanLegitimacy();
  });
  
  // Set up NBFC name input for autocomplete
  const nbfcNameInput = document.getElementById('nbfcName');
  const nbfcSuggestions = document.getElementById('nbfcSuggestions');
  
  nbfcNameInput.addEventListener('input', function() {
    const inputValue = this.value.trim().toLowerCase();
    
    // Clear previous suggestions
    nbfcSuggestions.innerHTML = '';
    
    if (inputValue.length < 2) return;
    
    // Filter NBFCs based on input
    const matches = nbfcData.filter(nbfc => 
      nbfc['NBFC Name'] && nbfc['NBFC Name'].toLowerCase().includes(inputValue)
    ).slice(0, 5); // Limit to 5 suggestions
    
    // Display suggestions
    if (matches.length > 0) {
      matches.forEach(match => {
        const item = document.createElement('a');
        item.classList.add('list-group-item', 'list-group-item-action', 'py-2');
        item.textContent = match['NBFC Name'];
        item.href = '#';
        item.addEventListener('click', function(e) {
          e.preventDefault();
          nbfcNameInput.value = this.textContent;
          nbfcSuggestions.innerHTML = '';
        });
        nbfcSuggestions.appendChild(item);
      });
    }
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target !== nbfcNameInput) {
      nbfcSuggestions.innerHTML = '';
    }
  });
  
  // Set up save result button
  document.getElementById('saveResult').addEventListener('click', saveResult);
  
  // Set up print result button
  document.getElementById('printResult').addEventListener('click', function() {
    window.print();
  });
});

// Dark mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const darkModeStorageKey = 'loanLegitimacyDarkMode';
  
  // Check for saved user preference
  const savedDarkMode = localStorage.getItem(darkModeStorageKey);
  
  // Apply dark mode if previously saved
  if (savedDarkMode === 'true') {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }
  
  // Toggle dark mode on switch change
  darkModeToggle.addEventListener('change', function() {
    if (this.checked) {
      body.classList.add('dark-mode');
      localStorage.setItem(darkModeStorageKey, 'true');
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem(darkModeStorageKey, 'false');
    }
  });
}

// Load NBFC data from CSV file
function loadNBFCData() {
  const csvFilePath = 'dataset/NBFCsandARCs10012023 (1) (1).csv';
  
  fetch(csvFilePath)
    .then(response => response.text())
    .then(csvData => {
      nbfcData = parseCsvData(csvData);
      console.log(`Loaded ${nbfcData.length} NBFCs from dataset`);
    })
    .catch(error => {
      console.error('Error loading NBFC data:', error);
      // Load sample data if CSV fails to load
      loadSampleData();
    });
}

// Parse CSV data into array of objects
function parseCsvData(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    // Handle commas within quoted fields
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue); // Add the last value
    
    // Create object with headers as keys
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
    });
    
    return obj;
  });
}

// Load sample data if CSV fails to load
function loadSampleData() {
  nbfcData = [
    { 'SR No.': '1', 'NBFC Name': 'Bajaj Finance Ltd.', 'Category': 'NBFC-D', 'Classification': 'ICC' },
    { 'SR No.': '2', 'NBFC Name': 'Shriram Finance Limited', 'Category': 'NBFC-D', 'Classification': 'ICC' },
    { 'SR No.': '3', 'NBFC Name': 'Tata Sons Private Limited', 'Category': 'NBFC-ND', 'Classification': 'CIC' },
    { 'SR No.': '4', 'NBFC Name': 'Cholamandalam Investment and Finance Company Limited', 'Category': 'NBFC-NDSI', 'Classification': 'ICC' },
    { 'SR No.': '5', 'NBFC Name': 'L&T Finance Limited', 'Category': 'NBFC-NDSI', 'Classification': 'ICC' }
  ];
  console.log('Loaded sample NBFC data');
}// Load scam history from localStorage
function loadScamHistory() {
  const savedHistory = localStorage.getItem(localStorageKey);
  
  if (savedHistory) {
    try {
      scamHistory = JSON.parse(savedHistory);
      updateScamHistoryDisplay();
    } catch (error) {
      console.error('Error parsing saved history:', error);
      scamHistory = [];
    }
  }
}

// Update scam history display
function updateScamHistoryDisplay() {
  const historyContainer = document.getElementById('scamHistory');
  
  if (scamHistory.length === 0) {
    historyContainer.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-clock-history fs-1"></i>
        <p class="mt-2">No recent scam alerts</p>
      </div>
    `;
    return;
  }
  
  historyContainer.innerHTML = '';
  
  // Sort by date (newest first)
  scamHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Display only the 5 most recent entries
  scamHistory.slice(0, 5).forEach(entry => {
    const date = new Date(entry.date).toLocaleDateString();
    const scoreClass = entry.score < 40 ? 'text-danger' : 
                      entry.score < 70 ? 'text-warning' : 'text-success';
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6>${entry.lenderName}</h6>
          <p class="text-muted mb-0 small">${date}</p>
        </div>
        <span class="badge ${scoreClass === 'text-danger' ? 'bg-danger' : 
                            scoreClass === 'text-warning' ? 'bg-warning text-dark' : 
                            'bg-success'}">${entry.score}%</span>
      </div>
      <p class="mb-0 small">${entry.recommendation}</p>
    `;
    
    historyContainer.appendChild(historyItem);
  });
}

// Calculate loan legitimacy based on input parameters
function calculateLoanLegitimacy() {
  // Get form values
  const nbfcName = document.getElementById('nbfcName').value.trim();
  const interestRate = parseFloat(document.getElementById('interestRate').value);
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const repaymentDuration = parseInt(document.getElementById('repaymentDuration').value);
  const processingFee = parseFloat(document.getElementById('processingFee').value);
  const disbursalTime = parseInt(document.getElementById('disbursalTime').value);
  
  // Get checkbox values
  const accessContacts = document.getElementById('accessContacts').checked;
  const accessPhotos = document.getElementById('accessPhotos').checked;
  const accessLocation = document.getElementById('accessLocation').checked;
  const requiresBankStatement = document.getElementById('requiresBankStatement').checked;
  
  // Additional notes
  const additionalNotes = document.getElementById('additionalNotes').value.trim();
  
  // Initialize legitimacy score
  let legitimacyScore = 50; // Start with neutral score
  let factors = [];
  
  // 1. Check if NBFC is in our database
  const nbfcMatch = nbfcData.find(nbfc => 
    nbfc['NBFC Name'] && nbfc['NBFC Name'].toLowerCase() === nbfcName.toLowerCase()
  );
  
  if (nbfcMatch) {
    legitimacyScore += 25;
    factors.push({
      factor: 'Registered NBFC',
      impact: 'Positive',
      description: 'Lender is registered with RBI as an NBFC',
      score: '+25'
    });
  } else {
    legitimacyScore -= 25;
    factors.push({
      factor: 'Unregistered Lender',
      impact: 'Negative',
      description: 'Lender not found in RBI registered NBFC database',
      score: '-25'
    });
  }
  
  // 2. Check interest rate
  if (interestRate < 7) {
    legitimacyScore -= 15;
    factors.push({
      factor: 'Suspiciously Low Interest Rate',
      impact: 'Negative',
      description: 'Interest rate is unusually low, which may be deceptive',
      score: '-15'
    });
  } else if (interestRate > 36) {
    legitimacyScore -= 20;
    factors.push({
      factor: 'Extremely High Interest Rate',
      impact: 'Negative',
      description: 'Interest rate exceeds reasonable lending standards',
      score: '-20'
    });
  } else if (interestRate <= 18) {
    legitimacyScore += 10;
    factors.push({
      factor: 'Reasonable Interest Rate',
      impact: 'Positive',
      description: 'Interest rate is within reasonable market range',
      score: '+10'
    });
  }  
  // 3. Check processing fee
  if (processingFee > 5) {
    legitimacyScore -= 15;
    factors.push({
      factor: 'High Processing Fee',
      impact: 'Negative',
      description: 'Processing fee is above industry standards',
      score: '-15'
    });
  } else if (processingFee === 0) {
    legitimacyScore += 5;
    factors.push({
      factor: 'No Processing Fee',
      impact: 'Positive',
      description: 'No processing fee charged',
      score: '+5'
    });
  } else {
    legitimacyScore += 5;
    factors.push({
      factor: 'Standard Processing Fee',
      impact: 'Positive',
      description: 'Processing fee is within industry standards',
      score: '+5'
    });
  }
  
  // 4. Check app permissions
  let permissionIssues = 0;
  if (accessContacts) permissionIssues++;
  if (accessPhotos) permissionIssues++;
  if (accessLocation) permissionIssues++;
  
  if (permissionIssues >= 2) {
    legitimacyScore -= 20;
    factors.push({
      factor: 'Excessive App Permissions',
      impact: 'Negative',
      description: 'App requests unnecessary access to personal data',
      score: '-20'
    });
  } else if (permissionIssues === 1) {
    legitimacyScore -= 5;
    factors.push({
      factor: 'Some App Permissions',
      impact: 'Slightly Negative',
      description: 'App requests some sensitive permissions',
      score: '-5'
    });
  } else {
    legitimacyScore += 10;
    factors.push({
      factor: 'Minimal App Permissions',
      impact: 'Positive',
      description: 'App does not request sensitive permissions',
      score: '+10'
    });
  }
  
  // 5. Check disbursal time
  if (disbursalTime < 1) {
    legitimacyScore -= 10;
    factors.push({
      factor: 'Instant Disbursal',
      impact: 'Negative',
      description: 'Unusually quick disbursal may indicate lack of proper verification',
      score: '-10'
    });
  } else if (disbursalTime <= 3) {
    legitimacyScore += 5;
    factors.push({
      factor: 'Quick Disbursal',
      impact: 'Positive',
      description: 'Reasonable disbursal timeframe',
      score: '+5'
    });
  }
  
  // 6. Check documentation requirements
  if (requiresBankStatement) {
    legitimacyScore += 10;
    factors.push({
      factor: 'Proper Documentation',
      impact: 'Positive',
      description: 'Lender requires appropriate documentation',
      score: '+10'
    });
  }
  
  // 7. Check loan amount vs duration ratio
  const monthlyPayment = loanAmount / repaymentDuration;
  if (monthlyPayment > 10000 && repaymentDuration < 6) {
    legitimacyScore -= 10;
    factors.push({
      factor: 'High Payment to Duration Ratio',
      impact: 'Negative',
      description: 'Short repayment period for large loan amount',
      score: '-10'
    });
  }
  
  // Ensure score is between 0 and 100
  legitimacyScore = Math.max(0, Math.min(100, legitimacyScore));
  
  // Display results
  displayResults(legitimacyScore, factors, nbfcName);
  
  // Return the calculated score and factors
  return {
    score: legitimacyScore,
    factors: factors
  };
}

// Display results in the UI
function displayResults(score, factors, lenderName) {
  const resultCard = document.getElementById('resultCard');
  const resultIcon = document.getElementById('resultIcon');
  const resultHeading = document.getElementById('resultHeading');
  const resultDescription = document.getElementById('resultDescription');
  const legitimacyScoreBar = document.getElementById('legitimacyScore');
  const resultDetails = document.getElementById('resultDetails');
  const recommendation = document.getElementById('recommendation');
  
  // Show result card
  resultCard.style.display = 'block';
  
  // Scroll to results
  resultCard.scrollIntoView({ behavior: 'smooth' });
  
  // Set score and styling based on legitimacy score
  legitimacyScoreBar.style.width = `${score}%`;
  
  let resultClass, iconHTML, headingText, descriptionText, recommendationText;
  
  if (score >= 70) {
    resultClass = 'legitimate';
    iconHTML = '<i class="bi bi-shield-check text-success" style="font-size: 3rem;"></i>';
    headingText = 'Likely Legitimate';
    descriptionText = 'This loan offer appears to be legitimate based on our analysis.';
    recommendationText = 'This appears to be a legitimate loan offer. However, always read the terms and conditions carefully before proceeding.';
  } else if (score >= 40) {
    resultClass = 'suspicious';
    iconHTML = '<i class="bi bi-shield-exclamation text-warning" style="font-size: 3rem;"></i>';
    headingText = 'Potentially Suspicious';
    descriptionText = 'This loan offer has some concerning elements that require caution.';
    recommendationText = 'Proceed with caution. Verify the lender\'s credentials directly with RBI and carefully review all terms before proceeding.';
  } else {
    resultClass = 'fraudulent';
    iconHTML = '<i class="bi bi-shield-x text-danger" style="font-size: 3rem;"></i>';
    headingText = 'Likely Fraudulent';
    descriptionText = 'This loan offer shows multiple red flags indicating potential fraud.';
    recommendationText = 'We strongly advise against proceeding with this loan offer as it shows multiple signs of being fraudulent.';
  }  
  // Update UI elements
  resultCard.className = `card mb-4 result-card ${resultClass}`;
  resultIcon.innerHTML = iconHTML;
  resultHeading.textContent = headingText;
  resultDescription.textContent = descriptionText;
  recommendation.textContent = recommendationText;
  
  // Update legitimacy score bar color
  legitimacyScoreBar.className = 'progress-bar';
  if (score >= 70) {
    legitimacyScoreBar.classList.add('bg-success');
  } else if (score >= 40) {
    legitimacyScoreBar.classList.add('bg-warning');
  } else {
    legitimacyScoreBar.classList.add('bg-danger');
  }
  
  // Display factors
  resultDetails.innerHTML = '<h6 class="mt-3">Analysis Factors</h6>';
  
  const factorsList = document.createElement('ul');
  factorsList.className = 'list-group list-group-flush';
  
  factors.forEach(factor => {
    const factorItem = document.createElement('li');
    factorItem.className = 'list-group-item px-0 py-2 border-0';
    
    const impactClass = factor.impact === 'Positive' ? 'text-success' : 
                       factor.impact === 'Negative' ? 'text-danger' : 'text-warning';
    
    factorItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span>${factor.factor}</span>
        <span class="${impactClass} fw-bold">${factor.score}</span>
      </div>
      <small class="text-muted">${factor.description}</small>
    `;
    
    factorsList.appendChild(factorItem);
  });
  
  resultDetails.appendChild(factorsList);
}

// Save result to history
function saveResult() {
  const nbfcName = document.getElementById('nbfcName').value.trim();
  const legitimacyScore = parseInt(document.getElementById('legitimacyScore').style.width);
  const recommendation = document.getElementById('recommendation').textContent;
  
  // Create history entry
  const historyEntry = {
    lenderName: nbfcName,
    score: legitimacyScore,
    recommendation: recommendation,
    date: new Date().toISOString()
  };
  
  // Add to history
  scamHistory.push(historyEntry);
  
  // Limit history to 20 entries
  if (scamHistory.length > 20) {
    scamHistory = scamHistory.slice(-20);
  }
  
  // Save to localStorage
  localStorage.setItem(localStorageKey, JSON.stringify(scamHistory));
  
  // Update display
  updateScamHistoryDisplay();
  
  // Show confirmation
  alert('Result saved to history!');
}

// Machine learning simulation - this would be replaced with actual ML in a production system
class LoanScamDetector {
  constructor() {
    this.trainingData = [];
    this.weights = {
      registeredNBFC: 0.4,
      interestRate: 0.2,
      processingFee: 0.1,
      appPermissions: 0.15,
      disbursalTime: 0.05,
      documentation: 0.1
    };
  }
  
  // Add a new data point to the training set
  addTrainingData(features, isScam) {
    this.trainingData.push({
      features: features,
      isScam: isScam
    });
    
    // In a real system, we would retrain the model here
    this.updateWeights();
  }
  
  // Update weights based on training data (simplified)
  updateWeights() {
    // This is a placeholder for actual machine learning
    // In a real system, this would use proper ML algorithms
    if (this.trainingData.length > 10) {
      // Adjust weights slightly based on new data
      this.weights.registeredNBFC *= 0.99;
      this.weights.interestRate *= 1.01;
      // etc.
    }
  }
  
  // Predict if a loan is a scam
  predict(features) {
    // Calculate weighted score
    let score = 0;
    score += features.registeredNBFC ? this.weights.registeredNBFC : 0;
    score += (1 - features.interestRateRisk) * this.weights.interestRate;
    score += (1 - features.processingFeeRisk) * this.weights.processingFee;
    score += (1 - features.appPermissionsRisk) * this.weights.appPermissions;
    score += (1 - features.disbursalTimeRisk) * this.weights.disbursalTime;
    score += features.properDocumentation ? this.weights.documentation : 0;
    
    // Normalize to 0-100
    return score * 100;
  }
}

// Initialize the ML model
const scamDetector = new LoanScamDetector();