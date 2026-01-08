<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <router-link to="/" class="btn">Go Home</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 2rem;
}

.not-found h1 {
  font-size: 5rem;
  margin: 0;
  color: #ccc;
}

.not-found p {
  font-size: 1.5rem;
  color: #666;
  margin: 1rem 0;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.btn:hover {
  background-color: #45a049;
}
</style>
