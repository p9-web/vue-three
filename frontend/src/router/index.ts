import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Index',
        component: () => import('../layouts/Default.vue'),
        children: [
            { path: '', component: () => import('../pages/Index.vue') }
        ],
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('../pages/Error404.vue'),
    },
]

const index = createRouter({
    history: createWebHashHistory(),
    routes
})

// index.beforeEach((to, from) => {
//     console.log(to, from);
// })

export default index;
