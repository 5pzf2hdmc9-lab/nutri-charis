import { sanitizeText } from '../lib/authAccess';
import { parseStrictNum } from '../lib/nutrition-math';
import { parseClientFolder } from '../lib/practiceSchemas';
import { authRateKey, checkRateLimit, resetRateLimit } from '../lib/rateLimit';
import { supabase } from '../supabaseClient';

export function createAuthHandlers(deps) {
  const { art9Accepted, authActivity, authAge, authAllergies, authEmail, authGender, authGoal, authHeight, authMode, authName, authPassword, authPhone, authSubmitting, authWeight, clients, gdprAccepted, selectedMicros, setAuthError, setAuthSubmitting, setAuthSuccess, showToast, termsAccepted } = deps;
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authSubmitting) return;
    setAuthError('');
    setAuthSuccess('');

    const emailClean = sanitizeText(authEmail, 180).trim().toLowerCase();
    const action =
      authMode === 'forgot' ? 'forgot' : authMode === 'register' ? 'signup' : 'login';
    const rl = checkRateLimit(authRateKey(action, emailClean), 8, 15 * 60 * 1000);
    if (!rl.allowed) {
      setAuthError(`Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε ${rl.retryAfterSec} δευτερόλεπτα.`);
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
          redirectTo: `${window.location.origin}/`
        });
        if (error) setAuthError(error.message);
        else setAuthSuccess('✓ Στάλθηκε σύνδεσμος επαναφοράς κωδικού στο email σας!');
        return;
      }

      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password: authPassword
        });
        if (error) setAuthError('Λάθος email ή κωδικός πρόσβασης.');
        else resetRateLimit(authRateKey('login', emailClean));
      } else if (authMode === 'register') {
        if (!gdprAccepted || !art9Accepted || !termsAccepted) {
          setAuthError('Απαιτείται ρητή συγκατάθεση GDPR, Άρθρου 9 (δεδομένα υγείας) και Όρων Χρήσης.');
          return;
        }
        if (authPassword.length < 6) {
          setAuthError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
          return;
        }
        const age = parseStrictNum(authAge, 5, 115);
        const weight = parseStrictNum(authWeight, 25, 350);
        const height = parseStrictNum(authHeight, 90, 240);
        if (Number.isNaN(age) || Number.isNaN(weight) || Number.isNaN(height)) {
          setAuthError('Μη έγκυρα ανθρωπομετρικά (ηλικία 5–115, βάρος 25–350kg, ύψος 90–240cm).');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: emailClean,
          password: authPassword
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data?.user?.id) {
          const consentAt = new Date().toISOString();
          const folder = {
              name: sanitizeText(authName, 120) || emailClean.split('@')[0],
              email: emailClean,
              phone: sanitizeText(authPhone, 40),
              gender: authGender === 'male' ? 'male' : 'female',
              age,
              weight,
              height,
              goal: sanitizeText(authGoal, 200) || 'Ισορροπημένη διατροφή',
              gdpr_consent_at: consentAt,
              art9_consent_at: consentAt,
              terms_accepted_at: consentAt
          };
          const parsedFolder = parseClientFolder(folder);
          if (!parsedFolder.success) {
            setAuthError(parsedFolder.error.issues?.[0]?.message || 'Μη έγκυρα στοιχεία εγγραφής.');
            return;
          }
          const { error: insertErr } = await supabase.from('clients').insert([
            {
              ...parsedFolder.data,
              user_id: data.user.id,
              questionnaire: {
                bmrFormula: 'mifflin',
                activityLevel: Number(authActivity) || 1.375,
                calorieDelta: 0,
                waterIntake: '1.5 - 2 λίτρα',
                healthOther: sanitizeText(authAllergies, 300),
                selectedMicros: ['vitA', 'vitC', 'vitD', 'calcium', 'iron', 'magnesium', 'potassium', 'zinc'],
                gdprAcceptedAt: consentAt,
                art9AcceptedAt: consentAt,
                termsAcceptedAt: consentAt
              },
              meal_plan: {}
            }
          ]);
          if (insertErr) {
            setAuthError(insertErr.message || 'Αποτυχία δημιουργίας φακέλου.');
            return;
          }
          resetRateLimit(authRateKey('signup', emailClean));
          showToast('✓ Ο φάκελος & ο λογαριασμός δημιουργήθηκαν!');
        }
      }
    } catch (err) {
      setAuthError(err?.message || 'Αποτυχία σύνδεσης. Δοκιμάστε ξανά.');
    } finally {
      setAuthSubmitting(false);
    }
  };
  return { handleAuthSubmit };
}
