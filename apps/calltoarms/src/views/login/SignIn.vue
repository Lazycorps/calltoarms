<template>
  <v-container fluid class="fill-height d-flex justify-center align-center">
    <v-card width="450px" class="pa-10 d-flex flex-column" rounded="100">
      <v-card-title>Sign In </v-card-title>
      <v-text-field v-model="email" label="Email"></v-text-field>
      <v-text-field
        :type="passwordType"
        label="Password"
        v-model="password"
        append-inner-icon="mdi-eye"
        @click:append-inner="
          passwordType == 'password'
            ? (passwordType = 'text')
            : (passwordType = 'password')
        "
      />
      <v-alert
        type="warning"
        class="mb-5"
        variant="tonal"
        v-if="errorValidationEmail"
      >
        Email Not Verified. Check your inbox for the verification email sent to
        you or
        <a @click="sendValidation" href="#" variant="text"
          >resend validation email</a
        >.
      </v-alert>
      <v-alert type="error" class="mb-5" variant="tonal" v-else-if="error">
        {{ error }}
      </v-alert>
      <v-alert
        type="success"
        class="mb-5"
        variant="tonal"
        v-if="successMessage"
      >
        {{ successMessage }}
      </v-alert>
      <div class="align-self-end">
        <v-btn
          @click="router.push('Register')"
          class="mr-5"
          color="primary"
          variant="text"
          >register</v-btn
        >
        <v-btn @click="signIn" color="primary" variant="flat">Sign In</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  applyActionCode,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { useRoute, useRouter } from "vue-router";

const passwordType = ref<"password" | "text">("password");
const email = ref("");
const password = ref("");
const router = useRouter();
const route = useRoute();
const successMessage = ref("");
const errorValidationEmail = ref(false);
const error = ref("");

onMounted(() => {
  const mode = route.query.mode;
  if (!route.query?.oobCode) return;
  if (mode == "verifyEmail") handleVerifyEmail(route.query.oobCode.toString());
});

async function signIn() {
  try {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email.value, password.value);
    await setPersistence(auth, browserLocalPersistence);
    if (!auth.currentUser?.emailVerified) {
      errorValidationEmail.value = true;
    } else router.push("/");
  } catch (err: any) {
    error.value = "Invalid email or password.";
  }
}

async function sendValidation() {
  const auth = getAuth();
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

async function handleVerifyEmail(actionCode: string) {
  try {
    const auth = getAuth();
    await applyActionCode(auth, actionCode);
    successMessage.value = "Email address has been verified.";
  } catch (err: any) {
    error.value = err.code;
  }
}
</script>
