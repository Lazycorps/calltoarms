<template>
  <v-container fluid class="fill-height d-flex justify-center align-center">
    <v-card width="450px" class="pa-10 d-flex flex-column" rounded="100">
      <v-card-title>Create an Account</v-card-title>
      <v-text-field label="Username" v-model="username" />
      <v-text-field label="Email" v-model="email" />
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
      <v-alert type="error" class="mb-5" variant="tonal" v-if="error">
        {{ error }}
      </v-alert>
      <div class="align-self-end">
        <v-btn @click="router.push('Signin')" color="primary" variant="text"
          >Sign In</v-btn
        >
        <v-btn color="primary" variant="flat" @click="register">Register</v-btn>
      </div>
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
import { usersDB } from "@/fireStore/UsersDB";
const router = useRouter();

const passwordType = ref<"password" | "text">("password");

const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");

const auth = getAuth();
async function register() {
  try {
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
    await usersDB.addCurrentUser();
    router.push("RegisterValidation");
  } catch (err: any) {
    if (err.code === "auth/invalid-email")
      error.value =
        "The provided value for the email user property is invalid. It must be a string email address.";
    else if (err.code === "auth/email-already-exists")
      error.value =
        "The provided email is already in use by an existing user. Each user must have a unique email.";
    else error.value = err.code;
  }
}
</script>
