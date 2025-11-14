window.ExternalValidator = {
  isEmailValid(email) {
    return email.includes('@') && email.includes('.');
  }
};

// Alternative name for compatibility
window.isEmailValidBasicThirdParty = window.ExternalValidator.isEmailValid;