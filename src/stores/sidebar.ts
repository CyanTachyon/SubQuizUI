import { markRaw, ref } from "vue";

const sidebars = ref<{
    id: string;
    icon: any;
    sidebar: any;
    open: boolean;
}[]>([]);
export function addSidebar(
    id: string,
    icon: any,
    sidebar: any,
)
{
    sidebars.value.push({ id, icon: markRaw(icon), sidebar: markRaw(sidebar), open: false });
}

export function getSidebars()
{
    return sidebars.value;
}

export function removeSidebar(id: string)
{
    sidebars.value = sidebars.value.filter((sidebar) => sidebar.id !== id);
}
