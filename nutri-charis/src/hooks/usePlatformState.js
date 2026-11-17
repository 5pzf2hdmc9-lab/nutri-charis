import { useState } from 'react';
import { APPOINTMENT_TYPES } from '../constants/appointments';
import { DEFAULT_MEAL_IDEAS, DEFAULT_WEEK_TEMPLATES, mergeWeekTemplates } from '../constants/dietPlan';
import { isPasswordRecoveryFromUrl } from '../lib/authUrl';

export function usePlatformState() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState(() =>
    isPasswordRecoveryFromUrl() ? 'recovery' : 'login'
  ); // 'login' | 'register' | 'forgot' | 'recovery'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [art9Accepted, setArt9Accepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);
  const [newClientGdpr, setNewClientGdpr] = useState(false);
  const [newClientArt9, setNewClientArt9] = useState(false);
  const [newClientTerms, setNewClientTerms] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authGender, setAuthGender] = useState('female');
  const [authAge, setAuthAge] = useState('30');
  const [authWeight, setAuthWeight] = useState('65');
  const [authHeight, setAuthHeight] = useState('165');
  const [authActivity, setAuthActivity] = useState(1.375);
  const [authGoal, setAuthGoal] = useState('Απώλεια λίπους & ρύθμιση μεταβολισμού');
  const [authAllergies, setAuthAllergies] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Core Data
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [activeClientId, setActiveClientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('plan');
  const [profileSubTab, setProfileSubTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState('Δευτέρα');
  const [cloneTargetDay, setCloneTargetDay] = useState('Πέμπτη');
  const [pdfTheme, setPdfTheme] = useState('green');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Client Interactive Adherence & Water Log
  const [completedMeals, setCompletedMeals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nutricharis_adherence') || '{}');
    } catch {
      return {};
    }
  });
  const [waterGlasses, setWaterGlasses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nutricharis_water_glasses') || '{}');
    } catch {
      return {};
    }
  });

  // Week Templates Vault
  const [newTemplateName, setNewTemplateName] = useState('');
  const [weekTemplates, setWeekTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem('nutricharis_week_templates');
      if (!stored) return DEFAULT_WEEK_TEMPLATES;
      return mergeWeekTemplates(JSON.parse(stored));
    } catch {
      return DEFAULT_WEEK_TEMPLATES;
    }
  });

  // Gemini AI & Custom Ideas State
  const [apiKey, setApiKey] = useState(() => {
    try {
      localStorage.removeItem('nutricharis_gemini_key');
    } catch {
      /* private mode */
    }
    return '';
  });
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiDay, setAiDay] = useState('Δευτέρα');
  const [aiMealType, setAiMealType] = useState('Πρωινό');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFullWeekLoading, setAiFullWeekLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [fdaAiOverride, setFdaAiOverride] = useState(null);

  const [customIdeaText, setCustomIdeaText] = useState('');
  const [customIdeaCategory, setCustomIdeaCategory] = useState('Πρωινό');
  const [ideaFilter, setIdeaFilter] = useState('Όλα');
  const [savedIdeas, setSavedIdeas] = useState(() => {
    try {
      const stored = localStorage.getItem('nutricharis_custom_ideas');
      return stored ? JSON.parse(stored) : DEFAULT_MEAL_IDEAS;
    } catch {
      return DEFAULT_MEAL_IDEAS;
    }
  });

  // Cell & Client Edit Modals
  const [editingCell, setEditingCell] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('female');
  const [editAge, setEditAge] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editQ, setEditQ] = useState({});

  // New Client Form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientGender, setNewClientGender] = useState('female');
  const [newClientAge, setNewClientAge] = useState('32');
  const [newClientWeight, setNewClientWeight] = useState('68');
  const [newClientHeight, setNewClientHeight] = useState('166');
  const [newClientGoal, setNewClientGoal] = useState('Απώλεια λίπους & ρύθμιση μεταβολισμού');

  // Appointments & Measurements
  const [apptDate, setApptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [apptTime, setApptTime] = useState('10:30');
  const [apptType, setApptType] = useState(APPOINTMENT_TYPES[0]);
  const [apptNotes, setApptNotes] = useState('');
  const [apptFilter, setApptFilter] = useState('upcoming');
  const [measWeight, setMeasWeight] = useState('');
  const [measFat, setMeasFat] = useState('');
  const [measMuscle, setMeasMuscle] = useState('');
  const [measWaist, setMeasWaist] = useState('');
  const [measAnthro, setMeasAnthro] = useState({});

  // Calculator
  const [calcGender, setCalcGender] = useState('female');
  const [calcAge, setCalcAge] = useState('30');
  const [calcWeight, setCalcWeight] = useState('65');
  const [calcHeight, setCalcHeight] = useState('165');
  const [calcBodyFat, setCalcBodyFat] = useState('');
  const [calcActivity, setCalcActivity] = useState(1.375);
  return { session, setSession, authLoading, setAuthLoading, authMode, setAuthMode, authEmail, setAuthEmail, authPassword, setAuthPassword, showPassword, setShowPassword, gdprAccepted, setGdprAccepted, art9Accepted, setArt9Accepted, termsAccepted, setTermsAccepted, legalDoc, setLegalDoc, newClientGdpr, setNewClientGdpr, newClientArt9, setNewClientArt9, newClientTerms, setNewClientTerms, dataLoading, setDataLoading, dataError, setDataError, newPasswordInput, setNewPasswordInput, confirmPasswordInput, setConfirmPasswordInput, passwordUpdating, setPasswordUpdating, authSubmitting, setAuthSubmitting, authName, setAuthName, authPhone, setAuthPhone, authGender, setAuthGender, authAge, setAuthAge, authWeight, setAuthWeight, authHeight, setAuthHeight, authActivity, setAuthActivity, authGoal, setAuthGoal, authAllergies, setAuthAllergies, authError, setAuthError, authSuccess, setAuthSuccess, clients, setClients, clientSearch, setClientSearch, activeClientId, setActiveClientId, appointments, setAppointments, measurements, setMeasurements, activeTab, setActiveTab, profileSubTab, setProfileSubTab, selectedDay, setSelectedDay, cloneTargetDay, setCloneTargetDay, pdfTheme, setPdfTheme, showPdfModal, setShowPdfModal, showShoppingModal, setShowShoppingModal, showTemplatesModal, setShowTemplatesModal, completedMeals, setCompletedMeals, waterGlasses, setWaterGlasses, newTemplateName, setNewTemplateName, weekTemplates, setWeekTemplates, apiKey, setApiKey, tempApiKey, setTempApiKey, showApiKeyModal, setShowApiKeyModal, aiDay, setAiDay, aiMealType, setAiMealType, aiCustomPrompt, setAiCustomPrompt, aiLoading, setAiLoading, aiFullWeekLoading, setAiFullWeekLoading, aiOptions, setAiOptions, fdaLoading, setFdaLoading, fdaAiOverride, setFdaAiOverride, customIdeaText, setCustomIdeaText, customIdeaCategory, setCustomIdeaCategory, ideaFilter, setIdeaFilter, savedIdeas, setSavedIdeas, editingCell, setEditingCell, editingClient, setEditingClient, editName, setEditName, editPhone, setEditPhone, editGender, setEditGender, editAge, setEditAge, editWeight, setEditWeight, editHeight, setEditHeight, editGoal, setEditGoal, editQ, setEditQ, showNewClientForm, setShowNewClientForm, newClientName, setNewClientName, newClientEmail, setNewClientEmail, newClientPhone, setNewClientPhone, newClientGender, setNewClientGender, newClientAge, setNewClientAge, newClientWeight, setNewClientWeight, newClientHeight, setNewClientHeight, newClientGoal, setNewClientGoal, apptDate, setApptDate, apptTime, setApptTime, apptType, setApptType, apptNotes, setApptNotes, apptFilter, setApptFilter, measWeight, setMeasWeight, measFat, setMeasFat, measMuscle, setMeasMuscle, measWaist, setMeasWaist, measAnthro, setMeasAnthro, calcGender, setCalcGender, calcAge, setCalcAge, calcWeight, setCalcWeight, calcHeight, setCalcHeight, calcBodyFat, setCalcBodyFat, calcActivity, setCalcActivity };
}
