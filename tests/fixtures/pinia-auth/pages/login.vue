<script setup lang="ts">
import { navigateTo, reactive, useAuthStore } from '#imports'

const authStore = useAuthStore()

const auth = reactive<{ userId: string, password: string }>({
  userId: 'test',
  password: '12345',
})

async function login() {
  const { user } = await authStore.authenticate({ strategy: 'local', ...auth })
  navigateTo(`/user/${user.userId}`)
}
</script>

<template>
  <div>
    <h1>login-page</h1>
    <form @submit.prevent="login">
      <button type="submit" data-testid="login-button">
        login-button
      </button>
    </form>
  </div>
</template>
