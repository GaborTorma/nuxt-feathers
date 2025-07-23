<script setup lang="ts">
import { useService } from '#imports'

const messages = await useService('messages').find({ paginate: false })
</script>

<template>
  <div>
    <p v-for="message in messages" :key="message.id" :data-testid="`message-${message.id}`">
      {{ message.id }}: {{ message.text }}
    </p>
  </div>
</template>
