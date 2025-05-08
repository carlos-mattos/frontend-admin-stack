// project imports
import { useGetMenu } from 'api/menu';

const icons = {};

const loadingMenu = {};

// ==============================|| MENU ITEMS - API ||============================== //

export function Menu() {
  const { menu, menuLoading } = useGetMenu();

  if (menuLoading) return loadingMenu;

  const SubChildrenLis = (subChildrenLis) => {
    return subChildrenLis?.map((subList) => {
      return {
        ...subList,
        title: subList.title,
        // @ts-ignore
        icon: icons[subList.icon]
      };
    });
  };

  const menuItem = (subList) => {
    let list = {
      ...subList,
      title: subList.title,
      // @ts-ignore
      icon: icons[subList.icon]
    };

    if (subList.type === 'collapse') {
      list.children = SubChildrenLis(subList.children);
    }
    return list;
  };

  const withoutMenu = menu?.children?.filter((item) => item.id !== 'no-menu');

  const ChildrenList = withoutMenu?.map((subList) => menuItem(subList));

  let menuList = {
    ...menu,
    title: menu?.title,
    // @ts-ignore
    icon: icons[menu?.icon],
    children: ChildrenList
  };

  return menuList;
}
