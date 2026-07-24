import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/components/Dashboard.vue'
import RecordDetail from '@/components/RecordDetail.vue'

const routes = [
  {
    path: '/about',
    name: 'About',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/r/:id',
    name: 'recorddetail',
    component: RecordDetail,
    props: route => ({ recordId: route.params.id })
  },
  {
    path: '/:query_string?',
    name: 'Dashboard',
    component: Dashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
