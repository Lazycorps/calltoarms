<template>
  <v-content>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title class="red--text">
              <h3>New account</h3>
            </v-card-title>
            <v-card-text>
              <v-form v-model="isValid" lazy-validation>
                <v-text-field
                  label="Username"
                  ref="loginElement"
                  name="login"
                  prepend-icon="mdi-account"
                  type="text"
                  v-model="username"
                  :rules="usernameRules"
                  validate-on-blur
                  color="blue"
                ></v-text-field>
                <v-text-field
                  label="Email"
                  prepend-icon="mdi-email"
                  name="email"
                  type="text"
                  v-model="email"
                  :rules="emailRules"
                  validate-on-blur
                  color="blue"
                ></v-text-field>
                <v-text-field
                  id="password"
                  label="Password"
                  name="password"
                  prepend-icon="mdi-lock"
                  v-model="password"
                  :rules="passwordRules"
                  :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye' "
                  @click:append="showPassword = !showPassword"
                  :type="showPassword ? 'text' : 'password'"
                  validate-on-blur
                  color="blue"
                  hint="Min. 8 characters with at least one capital letter, a number and a special character."
                ></v-text-field>
                <v-checkbox v-model="agreeShit" label="I agree this blabla shit" color="blue"></v-checkbox>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn tile color="primary" :loading="loading" @click="login"
                >Register</v-btn
              >
            </v-card-actions>
            <v-card-text v-if="errorMessage != ''">
              <v-alert type="warning">{{ errorMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { UserModule } from "@/store/modules/user";

@Component({
  name: "Register"
})
export default class extends Vue {
  private username: string = "";
  private usernameRules: any = [(v: string) =>  !!v || "Username is required", 
                               (v: string) => v.length >= 3 || "Three chars min"];

  private email: string = "";
  private emailRules: any = [(v: string) =>  !!v || "Email is required", 
                             (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'];
  
  private showPassword:boolean = false;
  private password: string = "";
  private passwordRules: any = [(v: string) =>  !!v || "Required Field", 
                                (v: string) => this.passwordValidation(v)];

  private agreeShit: boolean = false;
  public loading: Boolean = false;
  public errorMessage: string = "";

  private passwordValidation(password: string): boolean | string{
    return true;
    
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    return (
      pattern.test(password) ||
      "Min. 8 characters with at least one capital letter, a number and a special character."
    );
  }

  public Register() {

  }
}
</script>
<style>
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus {
  -webkit-text-fill-color: white;
  transition: background-color 5000s ease-in-out 0s;
}
</style>