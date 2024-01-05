<template>
  <v-container fluid class="fill-height d-flex justify-center align-center">
    <v-card width="450px" class="pa-10 d-flex flex-column" rounded="100">
      <v-form
        :validate-on="validateOn"
        v-model="formIsValid"
        ref="formComponent"
      >
        <v-card-title>Create an account</v-card-title>
        <v-text-field
          label="Username"
          v-model="username"
          :rules="[rules.required, rules.min, rules.max]"
          class="mb-2"
        />
        <v-text-field
          label="Email"
          v-model="email"
          :rules="[rules.required, rules.email]"
          class="mb-2"
        />
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
          :rules="[rules.required, rules.passwordComplexity]"
          class="mb-2"
        />
        <v-alert type="error" class="mb-5" variant="tonal" v-if="error">
          {{ error }}
        </v-alert>
        <div class="align-self-end">
          <v-btn @click="router.push('Signin')" color="primary" variant="text"
            >Sign In</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            @click="register()"
            :loading="loading"
            >Register</v-btn
          >
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "vue-router";
import { useUserDB } from "@/db/UserDB";
import { VForm } from "vuetify/lib/components/index.mjs";
const router = useRouter();
const userDb = useUserDB();

const formComponent = ref<VForm>();
const passwordType = ref<"password" | "text">("password");

const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const formIsValid = ref(false);
const validateOn = ref<"input" | "submit">("submit");
const loading = ref(false);
const rules = {
  required: (v: string) => !!v || "Required.",
  min: (v: string) => v.length >= 4 || "Min 4 characters",
  max: (v: string) => v.length <= 12 || "Min 12 characters",
  email: (v: string) => /.+@.+\..+/.test(v) || "Must be a valid email",
  passwordComplexity: (v: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v) ||
    "Minimum eight characters, at least one letter and one number:",
};

const auth = getAuth();
async function register() {
  try {
    await formComponent.value?.validate();
    if (!formIsValid.value) return;
    loading.value = true;
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    if (!auth.currentUser) return;
    await sendEmailVerification(userCredential.user);
    await updateProfile(userCredential.user, {
      displayName: username.value,
    });
    await userDb.addCurrentUser();
    router.push("register/validation");
  } catch (err: any) {
    if (err.code === "auth/invalid-email")
      error.value =
        "The provided value for the email user property is invalid. It must be a string email address.";
    else if (err.code === "auth/email-already-exists")
      error.value =
        "The provided email is already in use by an existing user. Each user must have a unique email.";
    else error.value = err.code;
  } finally {
    validateOn.value = "input";
    loading.value = false;
  }
}
</script>
