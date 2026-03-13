import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

let WEB_CLIENT_ID: string | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const env = require('../config/env.json');
  WEB_CLIENT_ID = env?.webClientId;
} catch {
  // env.json absent — okay
}

export function configureGoogleSignIn({ webClientId }: { webClientId?: string } = {}) {
  try {
    const finalWeb = webClientId ?? WEB_CLIENT_ID;
    if (!finalWeb) return;
    GoogleSignin.configure({
      webClientId: finalWeb,
      offlineAccess: false,
    } as any);
  } catch {
    // ignore
  }
}

export async function initGlobalGoogleConfig() {
  configureGoogleSignIn();
}

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo: any = await GoogleSignin.signIn();
    // try to get tokens (idToken)
    let idToken: string | undefined = userInfo?.idToken;
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens?.idToken) idToken = tokens.idToken as string;
    } catch {
      // ignore
    }

    const email = (userInfo?.user?.email ?? (userInfo?.email ?? undefined)) as string | undefined;

    return { ok: true, idToken, email, user: userInfo?.user ?? userInfo };
  } catch (e: any) {
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, error: 'cancelled' };
    return { ok: false, error: e?.message ?? e };
  }
}
