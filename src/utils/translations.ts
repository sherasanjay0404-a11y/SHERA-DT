/**
 * Magilir Kulu — RuralShield AI
 * Complete Bilingual English & Tamil Translation Dictionary
 * Natural, accessible, and simple language suitable for rural women's self-help groups.
 */

export type Language = 'en' | 'ta';

export interface Translations {
  appName: string;
  appSubname: string;
  tagline: string;
  purposeDesc: string;
  welcomeBack: string;
  verifySubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  rememberEmail: string;
  networkBadgeStrong: string;
  networkBadgeWeak: string;
  networkBadgeOffline: string;
  networkDescStrong: string;
  networkDescWeak: string;
  networkDescOffline: string;
  checkingNetwork: string;
  verifyingIdentity: string;
  authFailed: string;
  tryAgain: string;
  backendUnavailable: string;
  passkeyHeading: string;
  passkeyPrompt: string;
  passkeyButton: string;
  passkeyVerifying: string;
  passkeyMissing: string;
  totpHeading: string;
  totpPrompt: string;
  totpLabel: string;
  totpButton: string;
  totpVerifying: string;
  totpMissing: string;
  totpAutoFill: string;
  offlinePinHeading: string;
  offlinePinPrompt: string;
  offlinePinLabel: string;
  offlinePinButton: string;
  offlinePinVerifying: string;
  offlinePinUnprovisioned: string;
  offlinePinQuickFill: string;
  locallyVerifiedTag: string;
  serverVerifiedTag: string;
  autoSelectedPolicyNotice: string;
  noManualSwitchNotice: string;
  passwordLabel: string;
  signIn: string;
  signOut: string;
  forgotPassword: string;
  recoveryTitle: string;
  recoveryAirGapNotice: string;
  recoveryStep1: string;
  recoveryStep2: string;
  recoveryUnderstood: string;
  benefit1Title: string;
  benefit1Desc: string;
  benefit2Title: string;
  benefit2Desc: string;
  benefit3Title: string;
  benefit3Desc: string;
  decisionMatrixTitle: string;
  decisionMatrixSubtitle: string;
  ruleStrong: string;
  ruleWeak: string;
  ruleOffline: string;
  enrollDrawerButton: string;
  sessionActiveUser: string;
  auditTrailTitle: string;
  colTimestamp: string;
  colMethod: string;
  colNetwork: string;
  colResult: string;
  colAccount: string;
  simulateLabel: string;
  simAuto: string;
  simStrong: string;
  simWeak: string;
  simOffline: string;

  // Role Names
  roleSuperAdmin: string;
  roleGroupAdmin: string;
  roleMember: string;

  // Super Admin
  superAdminTitle: string;
  superAdminSubtitle: string;
  totalGroupsStat: string;
  totalMembersStat: string;
  totalSavingsStat: string;
  totalDisbursedStat: string;
  pendingRegsStat: string;
  pendingApprovalsStat: string;
  tabMembersReg: string;
  tabShgGroups: string;
  tabFinancialQueues: string;
  tabLedgerAudit: string;
  tabWhatsAppComm: string;
  tabSecuritySettings: string;
  approveMemberBtn: string;
  rejectMemberBtn: string;
  allocateGroupBtn: string;
  createGroupBtn: string;
  assignAdminBtn: string;
  deactivateGroupBtn: string;
  activateGroupBtn: string;

  // Group Admin
  groupAdminTitle: string;
  groupAdminSubtitle: string;
  assignedGroupBadge: string;
  tabGroupMembers: string;
  tabPaymentQueue: string;
  tabLoanRequests: string;
  tabGroupLedger: string;
  tabOverdueTracking: string;
  tabGroupWhatsApp: string;
  verifyPaymentBtn: string;
  rejectPaymentBtn: string;
  approveLoanBtn: string;
  rejectLoanBtn: string;
  exportReportBtn: string;
  rejectionReasonPrompt: string;

  // Member Dashboard
  memberTitle: string;
  memberSubtitle: string;
  mySavingsStat: string;
  activeLoanStat: string;
  outstandingBalanceStat: string;
  nextDueDateStat: string;
  myGroupInfo: string;
  groupLeaderContact: string;
  tabMakePayment: string;
  tabApplyLoan: string;
  tabMyTransactions: string;
  tabMyReceipts: string;
  tabNotifications: string;
  tabChangePassword: string;
  pendingApprovalTitle: string;
  pendingApprovalDesc: string;
  submitPaymentBtn: string;
  submitLoanBtn: string;
  downloadReceiptBtn: string;
  paymentModeLabel: string;
  paymentTypeLabel: string;
  utrRefLabel: string;
  amountLabel: string;
  purposeLabel: string;
  tenureLabel: string;

  // Receipt Modal
  receiptModalTitle: string;
  receiptSerial: string;
  receiptDate: string;
  receiptPayer: string;
  receiptShg: string;
  receiptAmount: string;
  receiptStatusVerified: string;
  receiptSeal: string;
  receiptPrintBtn: string;
  receiptCloseBtn: string;

  // WhatsApp
  waModalTitle: string;
  waSelectMember: string;
  waSelectTemplate: string;
  waPreview: string;
  waSendBtn: string;
  waHistoryTitle: string;
  waHistoryEmpty: string;

  // Member Registration
  registerTab: string;
  registerTitle: string;
  registerSubtitle: string;
  fullNameLabel: string;
  phoneLabel: string;
  villageLabel: string;
  preferredGroupLabel: string;
  registerSubmitBtn: string;
  registerSuccessMsg: string;
  pendingApprovalBanner: string;
  backToLogin: string;
  noAccountYet: string;
  alreadyRegistered: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Magilir Kulu',
    appSubname: 'SHE SHEIELD AI',
    tagline: "Authentication That Works Even When the Network Doesn't.",
    purposeDesc:
      'Provide secure and accessible login for Magilir Kulu users, especially those in rural areas with unstable internet connectivity.',
    welcomeBack: 'Welcome Back',
    verifySubtitle: 'Verify your identity securely with network-adaptive protection.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'member@magilirkulu.org',
    rememberEmail: 'Remember email on this device',
    networkBadgeStrong: 'Strong Network',
    networkBadgeWeak: 'Weak Network',
    networkBadgeOffline: 'Offline Mode',
    networkDescStrong: 'A stable connection is available. Passkey authentication is recommended.',
    networkDescWeak: 'Your connection is unstable. TOTP authentication is recommended.',
    networkDescOffline: 'The server cannot be reached. Only previously provisioned trusted-device access may be available.',
    checkingNetwork: 'Checking Network...',
    verifyingIdentity: 'Verifying Identity...',
    authFailed: 'Authentication Failed',
    tryAgain: 'Try Again',
    backendUnavailable: 'Backend Unavailable',
    passkeyHeading: 'Passkey Authentication',
    passkeyPrompt: 'Continue securely with your passkey.',
    passkeyButton: 'Verify with Passkey',
    passkeyVerifying: 'Prompting Authenticator...',
    passkeyMissing:
      'Passkey enrollment is required for this account. Please connect with your Magilir Kulu administrator or register via the Credential Drawer above.',
    totpHeading: 'TOTP Authentication',
    totpPrompt: 'Enter the code from your authenticator application.',
    totpLabel: '6-Digit Authenticator Code',
    totpButton: 'Submit Code',
    totpVerifying: 'Verifying TOTP Code...',
    totpMissing:
      'TOTP has not been enrolled for this account. Please configure it through the approved Magilir Kulu setup process.',
    totpAutoFill: 'Auto-fill current test code',
    offlinePinHeading: 'Trusted Device PIN',
    offlinePinPrompt: 'Check this device for authorized offline access.',
    offlinePinLabel: 'Local Device PIN',
    offlinePinButton: 'Unlock Trusted Device',
    offlinePinVerifying: 'Verifying Device PIN...',
    offlinePinUnprovisioned:
      'Offline access has not been configured on this device. Connect to the internet and complete the approved device-provisioning process first.',
    offlinePinQuickFill: 'Use default provisioned PIN (1234)',
    locallyVerifiedTag: 'Locally verified — offline access only.',
    serverVerifiedTag: 'Server-side verified online session.',
    autoSelectedPolicyNotice:
      'The authentication method is automatically selected based on current network conditions. User manual selection is disabled by cybersecurity policy.',
    noManualSwitchNotice: 'No manual switching: Determined automatically by network latency & reachability.',
    passwordLabel: 'Password (Administrator & Permitted Fallback)',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    forgotPassword: 'Forgot password or account recovery?',
    recoveryTitle: 'Authorized Magilir Kulu Account Recovery',
    recoveryAirGapNotice:
      'To prevent account takeover in rural areas with unverified cellular routing, Magilir Kulu does not transmit recovery links via SMS, WhatsApp, or unsecured external email.',
    recoveryStep1:
      'In-Person Verification: Report to an authorized Magilir Kulu village coordinator or security administrator.',
    recoveryStep2:
      'Credential Re-provisioning: The administrator will verify your SHG identity and re-issue a security key or provision a fresh device lease.',
    recoveryUnderstood: 'Understood',
    benefit1Title: 'Passkey Security',
    benefit1Desc:
      'FIDO2 biometric and hardware cryptographic assertions protect against phishing during good connectivity.',
    benefit2Title: 'Network-Aware Authentication',
    benefit2Desc:
      'Automatically switches to lightweight RFC 6238 TOTP when network latency exceeds 500ms or during packet drops.',
    benefit3Title: 'Offline-Ready Access',
    benefit3Desc:
      'Pre-provisioned device-bound PIN leases verify locally without cell service or server connectivity.',
    decisionMatrixTitle: 'NAAA Decision Policy',
    decisionMatrixSubtitle: 'Strict Network-Determined Method',
    ruleStrong: 'STRONG NETWORK (≤500ms) → PASSKEY',
    ruleWeak: 'WEAK NETWORK (>500ms) → TOTP',
    ruleOffline: 'OFFLINE (Unreachable) → TRUSTED DEVICE PIN',
    enrollDrawerButton: 'Enroll & Test Credentials',
    sessionActiveUser: 'Active Authenticated Session',
    auditTrailTitle: 'Recent Authentication Audit Trail',
    colTimestamp: 'Timestamp',
    colMethod: 'Method',
    colNetwork: 'Network Profile',
    colResult: 'Outcome',
    colAccount: 'Account',
    simulateLabel: 'Network Simulator:',
    simAuto: 'Auto (Real)',
    simStrong: 'Strong (≤500ms)',
    simWeak: 'Weak (>500ms)',
    simOffline: 'Offline',

    // Role Names
    roleSuperAdmin: 'Super Administrator',
    roleGroupAdmin: 'SHG Group Leader (Admin)',
    roleMember: 'SHG Collective Member',

    // Super Admin
    superAdminTitle: 'State Headquarters & Super Admin Control Center',
    superAdminSubtitle: 'Organization-wide governance, group allocation, financial queues, and security policies.',
    totalGroupsStat: 'Total SHG Groups',
    totalMembersStat: 'Total Members',
    totalSavingsStat: 'Total Savings Pool',
    totalDisbursedStat: 'Loans Disbursed',
    pendingRegsStat: 'Pending Registrations',
    pendingApprovalsStat: 'Payment / Loan Queue',
    tabMembersReg: 'Member Approvals & Allocation',
    tabShgGroups: 'SHG Groups Management',
    tabFinancialQueues: 'Financial Verification Queue',
    tabLedgerAudit: 'Transparent Ledger & Audit Logs',
    tabWhatsAppComm: 'WhatsApp Broadcast & Reminders',
    tabSecuritySettings: 'Security & Account Recovery',
    approveMemberBtn: 'Approve Registration',
    rejectMemberBtn: 'Reject Registration',
    allocateGroupBtn: 'Allocate to SHG Group',
    createGroupBtn: 'Create New SHG Group',
    assignAdminBtn: 'Assign Group Leader',
    deactivateGroupBtn: 'Deactivate Group',
    activateGroupBtn: 'Activate Group',

    // Group Admin
    groupAdminTitle: 'SHG Group Management Portal',
    groupAdminSubtitle: 'Restricted group-level operations, payment verification, and member reminders.',
    assignedGroupBadge: 'Assigned Collective Group',
    tabGroupMembers: 'Assigned Members',
    tabPaymentQueue: 'Payment Verification Queue',
    tabLoanRequests: 'Loan Amount Requests',
    tabGroupLedger: 'Group Financial Ledger',
    tabOverdueTracking: 'Repayment & Overdue Alerts',
    tabGroupWhatsApp: 'WhatsApp Member Reminders',
    verifyPaymentBtn: 'Verify Payment',
    rejectPaymentBtn: 'Reject Payment',
    approveLoanBtn: 'Approve Loan',
    rejectLoanBtn: 'Reject Request',
    exportReportBtn: 'Export Group Report (CSV)',
    rejectionReasonPrompt: 'Reason for rejection (shared with member):',

    // Member Dashboard
    memberTitle: 'Member Passbook & Self-Service Portal',
    memberSubtitle: 'Personal transparent ledger, online/offline payment submissions, and loan applications.',
    mySavingsStat: 'My Total Savings',
    activeLoanStat: 'Active Loan Principal',
    outstandingBalanceStat: 'Outstanding Balance',
    nextDueDateStat: 'Next EMI Due Date',
    myGroupInfo: 'My SHG Collective Group',
    groupLeaderContact: 'Group Animator / Leader Contact',
    tabMakePayment: 'Submit UPI / Cash Payment',
    tabApplyLoan: 'Apply for Loan / Amount Request',
    tabMyTransactions: 'My Transaction History',
    tabMyReceipts: 'Official Downloadable Receipts',
    tabNotifications: 'In-App Announcements',
    tabChangePassword: 'Change Password & Security',
    pendingApprovalTitle: 'Registration Under Review',
    pendingApprovalDesc: 'Your membership application is being reviewed by the State Coordinator. Once approved and allocated to an SHG group, your full member passbook will activate.',
    submitPaymentBtn: 'Submit Payment for Verification',
    submitLoanBtn: 'Submit Loan Application',
    downloadReceiptBtn: 'View / Print Official Receipt',
    paymentModeLabel: 'Payment Mode',
    paymentTypeLabel: 'Payment Category',
    utrRefLabel: 'UPI Transaction UTR or Cash Voucher #',
    amountLabel: 'Amount (₹)',
    purposeLabel: 'Purpose of Loan',
    tenureLabel: 'Repayment Period (Months)',

    // Receipt Modal
    receiptModalTitle: 'Official Magilir Kulu Payment Receipt',
    receiptSerial: 'Receipt Serial #',
    receiptDate: 'Date & Time',
    receiptPayer: 'Member Name',
    receiptShg: 'SHG Collective Group',
    receiptAmount: 'Amount Received',
    receiptStatusVerified: 'VERIFIED & DIGITALLY SEALED',
    receiptSeal: 'Cryptographic Hash Seal',
    receiptPrintBtn: 'Print / Save PDF Receipt',
    receiptCloseBtn: 'Close Receipt',

    // WhatsApp
    waModalTitle: 'Prepare WhatsApp Click-to-Chat Reminder',
    waSelectMember: 'Select Recipient Member',
    waSelectTemplate: 'Select Message Template',
    waPreview: 'Message Preview',
    waSendBtn: 'Launch WhatsApp (wa.me)',
    waHistoryTitle: 'Dispatched Reminder History',
    waHistoryEmpty: 'No WhatsApp reminders prepared yet.',

    // Member Registration
    registerTab: 'Register New Member',
    registerTitle: 'Self-Help Group Member Registration',
    registerSubtitle: 'Submit your profile for Administrator verification and group allocation.',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Mobile Phone Number',
    villageLabel: 'Village / Town / Panchayat',
    preferredGroupLabel: 'Preferred SHG Group (Optional)',
    registerSubmitBtn: 'Submit Registration for Approval',
    registerSuccessMsg: 'Your registration request has been submitted to the Administrator. Once approved, you can log in.',
    pendingApprovalBanner: 'Registration Pending Admin Approval',
    backToLogin: 'Back to Sign In',
    noAccountYet: 'New member? Register your details',
    alreadyRegistered: 'Already have an approved account? Sign in',
  },
  ta: {
    appName: 'மகளிர் குழு',
    appSubname: 'SHE SHEIELD AI (ஷீ ஷீல்டு)',
    tagline: 'இணைய இணைப்பு இல்லாதபோதும் பாதுகாப்பான அங்கீகாரம்.',
    purposeDesc:
      'இணைய இணைப்பு நிலையற்ற கிராமப்புற மகளிர் குழு உறுப்பினர்கள் மற்றும் தலைவர்களுக்கான பாதுகாப்பான உள்நுழைவு.',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    verifySubtitle: 'உங்கள் அடையாளத்தைப் பாதுகாப்பாகச் சரிபார்க்கவும்.',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'member@magilirkulu.org',
    rememberEmail: 'இந்தச் சாதனத்தில் மின்னஞ்சலை நினைவில் வைக்கவும்',
    networkBadgeStrong: 'வலுவான இணைய இணைப்பு',
    networkBadgeWeak: 'பலவீனமான இணைய இணைப்பு',
    networkBadgeOffline: 'இணைய இணைப்பு இல்லை',
    networkDescStrong: 'நிலையான இணைய இணைப்பு உள்ளது. Passkey அங்கீகாரம் பரிந்துரைக்கப்படுகிறது.',
    networkDescWeak: 'உங்கள் இணைய இணைப்பு சீரற்றதாக உள்ளது. TOTP அங்கீகாரம் பரிந்துரைக்கப்படுகிறது.',
    networkDescOffline: 'சேவையகத்தை அணுக முடியவில்லை. முன்பே அமைக்கப்பட்ட அங்கீகரிக்கப்பட்ட சாதன அணுகல் மட்டுமே கிடைக்கும்.',
    checkingNetwork: 'இணைய இணைப்பைச் சரிபார்க்கிறது...',
    verifyingIdentity: 'உங்கள் அடையாளத்தைச் சரிபார்க்கிறது...',
    authFailed: 'அங்கீகாரம் தோல்வியடைந்தது',
    tryAgain: 'மீண்டும் முயற்சிக்கவும்',
    backendUnavailable: 'சேவையகத்தை அணுக முடியவில்லை',
    passkeyHeading: 'Passkey அங்கீகாரம்',
    passkeyPrompt: 'உங்கள் Passkey மூலம் பாதுகாப்பாகத் தொடரவும்.',
    passkeyButton: 'Passkey மூலம் சரிபார்க்கவும்',
    passkeyVerifying: 'அங்கீகரிக்கும் கருவி சரிபார்க்கப்படுகிறது...',
    passkeyMissing:
      'இந்தக் கணக்கிற்கு Passkey பதிவு செய்யப்பட வேண்டும். உங்கள் மகளிர் குழு நிர்வாகியைத் தொடர்பு கொள்ளவும் அல்லது மேலே உள்ள அமைப்பைப் பயன்படுத்தவும்.',
    totpHeading: 'TOTP குறியீடு அங்கீகாரம்',
    totpPrompt: 'உங்கள் அங்கீகாரச் செயலியில் உள்ள குறியீட்டை உள்ளிடவும்.',
    totpLabel: '6-இலக்க அங்கீகாரக் குறியீடு',
    totpButton: 'குறியீட்டைச் சரிபார்க்கவும்',
    totpVerifying: 'TOTP குறியீடு சரிபார்க்கப்படுகிறது...',
    totpMissing:
      'இந்தக் கணக்கிற்கு TOTP அமைக்கப்படவில்லை. அங்கீகரிக்கப்பட்ட செயல்முறை மூலம் அமைக்கவும்.',
    totpAutoFill: 'சோதனை குறியீட்டை தானாக நிரப்பவும்',
    offlinePinHeading: 'அங்கீகரிக்கப்பட்ட சாதன PIN',
    offlinePinPrompt: 'இந்தச் சாதனத்தில் அங்கீகரிக்கப்பட்ட இணையமில்லா அணுகலைச் சரிபார்க்கவும்.',
    offlinePinLabel: 'உள்ளூர் சாதன PIN',
    offlinePinButton: 'நம்பகமான சாதனத்தைத் திறக்கவும்',
    offlinePinVerifying: 'சாதன PIN சரிபார்க்கப்படுகிறது...',
    offlinePinUnprovisioned:
      'இந்தச் சாதனத்தில் இணையமில்லா அணுகல் அமைக்கப்படவில்லை. முதலில் இணையத்துடன் இணைந்து அங்கீகரிக்கப்பட்ட சாதன அமைப்பை முடிக்கவும்.',
    offlinePinQuickFill: 'அமைக்கப்பட்ட PIN-ஐப் பயன்படுத்தவும் (1234)',
    locallyVerifiedTag: 'சாதனத்தில் சரிபார்க்கப்பட்டது — இணையமில்லா வரையறுக்கப்பட்ட அணுகல் மட்டுமே.',
    serverVerifiedTag: 'சேவையகத்தால் சரிபார்க்கப்பட்ட ஆன்லைன் அமர்வு.',
    autoSelectedPolicyNotice:
      'இணைய இணைப்பு நிலையின் அடிப்படையில் அங்கீகார முறை தானாகவே தேர்ந்தெடுக்கப்படுகிறது. பாதுகாப்பு விதிகளின்படி பயனர்கள் கைமுறையாக மாற்ற முடியாது.',
    noManualSwitchNotice: 'கைமுறை தேர்வு இல்லை: இணைய வேகம் மற்றும் சேவையக இணைப்பின் அடிப்படையில் தானாக முடிவு செய்யப்படுகிறது.',
    passwordLabel: 'கடவுச்சொல் (நிர்வாகி / அனுமதிக்கப்பட்ட அணுகல்)',
    signIn: 'உள்நுழைய',
    signOut: 'வெளியேறு',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா? கணக்கு மீட்பு',
    recoveryTitle: 'அங்கீகரிக்கப்பட்ட மகளிர் குழு கணக்கு மீட்பு',
    recoveryAirGapNotice:
      'கிராமப்புறங்களில் கணக்கு அபகரிப்பைத் தடுக்க, மகளிர் குழு SMS அல்லது WhatsApp வழியாக மீட்பு இணைப்புகளை அனுப்புவதில்லை.',
    recoveryStep1:
      'நேரடி சரிபார்ப்பு: உங்கள் மகளிர் குழுவின் கிராம ஒருங்கிணைப்பாளர் அல்லது நிர்வாகியை நேரடியாக அணுகவும்.',
    recoveryStep2:
      'அங்கீகார மறுவழங்கல்: நிர்வாகி உங்கள் சுயஉதவிக்குழு அடையாளத்தைச் சரிபார்த்து புதிய அணுகலை வழங்குவார்.',
    recoveryUnderstood: 'புரிந்துகொண்டேன்',
    benefit1Title: 'Passkey பாதுகாப்பு',
    benefit1Desc:
      'வலுவான இணையம் இருக்கும்போது கடவுச்சொற்களுக்குப் பதிலாக FIDO2 வன்பொருள் பாதுகாப்பு வழங்கப்படுகிறது.',
    benefit2Title: 'இணைப்புக்கேற்ப மாறும் அங்கீகாரம்',
    benefit2Desc:
      'அதிக தாமதம் அல்லது 2G நெட்வொர்க்கில் தானாகவே TOTP முறைக்கு மாறுகிறது.',
    benefit3Title: 'இணையமில்லா உடனடி அணுகல்',
    benefit3Desc:
      'முன்பே அமைக்கப்பட்ட சாதன PIN மூலம் செல்போன் டவர் இல்லாதபோதும் களத்தில் பயன்படுத்தலாம்.',
    decisionMatrixTitle: 'NAAA முடிவு கொள்கை',
    decisionMatrixSubtitle: 'கண்டிப்பான இணையநிலை முறை',
    ruleStrong: 'வலுவான இணையம் (≤500ms) → PASSKEY',
    ruleWeak: 'பலவீனமான இணையம் (>500ms) → TOTP',
    ruleOffline: 'இணைப்பு இல்லை (அணுக முடியவில்லை) → சாதன PIN',
    enrollDrawerButton: 'சான்றுகளை அமைத்து சோதிக்கவும்',
    sessionActiveUser: 'செயலில் உள்ள அங்கீகரிக்கப்பட்ட அமர்வு',
    auditTrailTitle: 'சமீபத்திய அங்கீகார நிகழ்வுகளின் பதிவு',
    colTimestamp: 'நேரம்',
    colMethod: 'முறை',
    colNetwork: 'நெட்வொர்க் நிலை',
    colResult: 'முடிவு',
    colAccount: 'கணக்கு',
    simulateLabel: 'நெட்வொர்க் சோதனைக் கருவி:',
    simAuto: 'தானியங்கி (உண்மை)',
    simStrong: 'வலுவானது (≤500ms)',
    simWeak: 'பலவீனமானது (>500ms)',
    simOffline: 'இணைப்பு இல்லை',

    // Role Names
    roleSuperAdmin: 'மாநில முதன்மை நிர்வாகி (Super Admin)',
    roleGroupAdmin: 'குழுத் தலைவி / அனிமேட்டர் (Group Admin)',
    roleMember: 'குழு உறுப்பினர் (Member)',

    // Super Admin
    superAdminTitle: 'மாநில தலைமையக நிர்வாக கட்டுப்பாட்டு மையம்',
    superAdminSubtitle: 'அனைத்து குழுக்கள், உறுப்பினர் சேர்க்கை அனுமதி, நிதிச் சரிபார்ப்பு மற்றும் பாதுகாப்பு அமைப்புகள்.',
    totalGroupsStat: 'மொத்த மகளிர் குழுக்கள்',
    totalMembersStat: 'மொத்த உறுப்பினர்கள்',
    totalSavingsStat: 'மொத்த சேமிப்புத் தொகை',
    totalDisbursedStat: 'வழங்கப்பட்ட கடன்கள்',
    pendingRegsStat: 'காத்திருக்கும் பதிவுகள்',
    pendingApprovalsStat: 'சரிபார்ப்பு வரிசை',
    tabMembersReg: 'உறுப்பினர் ஒப்புதல் & குழு ஒதுக்கீடு',
    tabShgGroups: 'மகளிர் குழுக்கள் மேலாண்மை',
    tabFinancialQueues: 'நிதி சரிபார்ப்பு வரிசை',
    tabLedgerAudit: 'வெளிப்படையான லெட்ஜர் & தணிக்கை',
    tabWhatsAppComm: 'வாட்ஸ்அப் தகவல் தொடர்பு',
    tabSecuritySettings: 'பாதுகாப்பு & கணக்கு மீட்பு',
    approveMemberBtn: 'பதிவை அங்கீகரி',
    rejectMemberBtn: 'பதிவை நிராகரி',
    allocateGroupBtn: 'குழுவில் ஒதுக்கு',
    createGroupBtn: 'புதிய மகளிர் குழுவை உருவாக்கு',
    assignAdminBtn: 'குழு தலைவியை நியமி',
    deactivateGroupBtn: 'குழுவை முடக்கு',
    activateGroupBtn: 'குழுவை செயல்படுத்து',

    // Group Admin
    groupAdminTitle: 'மகளிர் குழு நிர்வாக போர்டல்',
    groupAdminSubtitle: 'உங்கள் குழுவின் உறுப்பினர்கள், பணம் செலுத்துதல் சரிபார்ப்பு மற்றும் கடன் ஒப்புதல்.',
    assignedGroupBadge: 'ஒதுக்கப்பட்ட சுயஉதவிக்குழு',
    tabGroupMembers: 'குழு உறுப்பினர்கள்',
    tabPaymentQueue: 'செலுத்தல் சரிபார்ப்பு வரிசை',
    tabLoanRequests: 'கடன் விண்ணப்பங்கள்',
    tabGroupLedger: 'குழு வரவு-செலவு லெட்ஜர்',
    tabOverdueTracking: 'நிலுவைத் தொகை எச்சரிக்கைகள்',
    tabGroupWhatsApp: 'வாட்ஸ்அப் நினைவூட்டல்கள்',
    verifyPaymentBtn: 'பணம் செலுத்தலை அங்கீகரி',
    rejectPaymentBtn: 'நிராகரி',
    approveLoanBtn: 'கடனை அனுமதி',
    rejectLoanBtn: 'விண்ணப்பத்தை நிராகரி',
    exportReportBtn: 'அறிக்கையைப் பதிவிறக்கு (CSV)',
    rejectionReasonPrompt: 'நிராகரிப்பதற்கான காரணம் (உறுப்பினருக்குத் தெரிவிக்கப்படும்):',

    // Member Dashboard
    memberTitle: 'உறுப்பினர் கணக்குப் புத்தகம் (Passbook)',
    memberSubtitle: 'உங்கள் சேமிப்பு, கடன் நிலுவை, பணம் செலுத்துதல் மற்றும் ரசீதுகளைப் பதிவிறக்குதல்.',
    mySavingsStat: 'என் மொத்த சேமிப்பு',
    activeLoanStat: 'செயலில் உள்ள கடன்',
    outstandingBalanceStat: 'செலுத்த வேண்டிய நிலுவை',
    nextDueDateStat: 'அடுத்த தவணை தேதி',
    myGroupInfo: 'என் மகளிர் சுயஉதவிக்குழு',
    groupLeaderContact: 'குழு தலைவி / அனிமேட்டர் தொடர்பு',
    tabMakePayment: 'UPI / ரொக்கம் செலுத்துதல்',
    tabApplyLoan: 'கடன் தொகை விண்ணப்பிக்க',
    tabMyTransactions: 'என் பரிவர்த்தனை வரலாறு',
    tabMyReceipts: 'அங்கீகரிக்கப்பட்ட ரசீதுகள்',
    tabNotifications: 'குழு அறிவிப்புகள்',
    tabChangePassword: 'கடவுச்சொல் மாற்றுதல்',
    pendingApprovalTitle: 'விண்ணப்பம் பரிசீலனையில் உள்ளது',
    pendingApprovalDesc: 'உங்கள் உறுப்பினர் பதிவு மாநில ஒருங்கிணைப்பாளரின் பரிசீலனையில் உள்ளது. ஒப்புதல் அளிக்கப்பட்டு குழு ஒதுக்கப்பட்டதும் உங்கள் கணக்குப் புத்தகம் முழுமையாகச் செயல்படும்.',
    submitPaymentBtn: 'சரிபார்ப்பிற்குச் சமர்ப்பிக்கவும்',
    submitLoanBtn: 'கடன் விண்ணப்பத்தைச் சமர்ப்பி',
    downloadReceiptBtn: 'அதிகாரப்பூர்வ ரசீதைப் பார்க்க / அச்சிட',
    paymentModeLabel: 'பணம் செலுத்தும் முறை',
    paymentTypeLabel: 'பரிவர்த்தனை வகை',
    utrRefLabel: 'UPI UTR எண் அல்லது ரசீது எண்',
    amountLabel: 'தொகை (₹)',
    purposeLabel: 'கடன் நோக்கம்',
    tenureLabel: 'திருப்பிச் செலுத்தும் காலம் (மாதங்கள்)',

    // Receipt Modal
    receiptModalTitle: 'அதிகாரப்பூர்வ மகளிர் குழு கட்டண ரசீது',
    receiptSerial: 'ரசீது எண்',
    receiptDate: 'தேதி & நேரம்',
    receiptPayer: 'உறுப்பினர் பெயர்',
    receiptShg: 'மகளிர் சுயஉதவிக்குழு',
    receiptAmount: 'பெறப்பட்ட தொகை',
    receiptStatusVerified: 'சரிபார்க்கப்பட்டு முத்திரையிடப்பட்டது',
    receiptSeal: 'கிரிப்டோகிராஃபிக் ஹாஷ் முத்திரை',
    receiptPrintBtn: 'அச்சிட / PDF சேமிக்க',
    receiptCloseBtn: 'ரசீதை மூடு',

    // WhatsApp
    waModalTitle: 'வாட்ஸ்அப் நினைவூட்டல் செய்தி தயார் செய்தல்',
    waSelectMember: 'உறுப்பினரைத் தேர்ந்தெடுக்கவும்',
    waSelectTemplate: 'செய்தி டெம்ப்ளேட்டைத் தேர்ந்தெடுக்கவும்',
    waPreview: 'செய்தி முன்னோட்டம்',
    waSendBtn: 'வாட்ஸ்அப் திறக்க (wa.me)',
    waHistoryTitle: 'அனுப்பப்பட்ட நினைவூட்டல் வரலாறு',
    waHistoryEmpty: 'இதுவரை நினைவூட்டல் செய்திகள் அனுப்பப்படவில்லை.',

    // Member Registration
    registerTab: 'புதிய உறுப்பினர் பதிவு',
    registerTitle: 'மகளிர் சுயஉதவிக் குழு உறுப்பினர் பதிவு',
    registerSubtitle: 'நிர்வாகியின் சரிபார்ப்பு மற்றும் குழு ஒதுக்கீட்டிற்கு விவரங்களைச் சமர்ப்பிக்கவும்.',
    fullNameLabel: 'முழுப் பெயர்',
    phoneLabel: 'கைபேசி எண்',
    villageLabel: 'கிராமம் / பஞ்சாயத்து',
    preferredGroupLabel: 'விருப்பமான மகளிர் குழு (விருப்பமிருந்தால்)',
    registerSubmitBtn: 'ஒப்புதலுக்காகப் பதிவு செய்',
    registerSuccessMsg: 'உங்கள் பதிவு நிர்வாகியிடம் சமர்ப்பிக்கப்பட்டது! நிர்வாகி சரிபார்த்து ஒப்புதல் அளித்தவுடன் உள்நுழையலாம்.',
    pendingApprovalBanner: 'பதிவு நிர்வாகியின் ஒப்புதலுக்காக காத்திருக்கிறது',
    backToLogin: 'உள்நுழைவிற்குத் திரும்பு',
    noAccountYet: 'புதிய உறுப்பினரா? கணக்குப் பதிவு செய்யவும்',
    alreadyRegistered: 'ஏற்கனவே பதிந்துவிட்டீர்களா? உள்நுழைக',
  },
};
