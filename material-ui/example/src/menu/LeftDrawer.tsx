import React from 'react';

import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';

import MenuItems from './MenuItems';
import menuStyles from './menu-styles';

export default withStyles(menuStyles)(
  ({
    classes,
    open,
    toggleDrawer,
    onSelectMenuItem,
    selectedMenuItem,
  }: any) => (
    <>
      <Hidden only={['xs', 'sm', 'md']}>
        <Drawer variant={'permanent'} className={classes.permanentLeftDrawer}>
          <MenuItems
            toggleDrawer={toggleDrawer}
            onSelectMenuItem={onSelectMenuItem}
            selectedMenuItem={selectedMenuItem}
          />
        </Drawer>
      </Hidden>
      <Hidden only={['lg', 'xl']}>
        <Drawer
          open={open}
          className={classes.leftDrawer}
          onClose={toggleDrawer(false)}
        >
          <MenuItems
            toggleDrawer={toggleDrawer}
            onSelectMenuItem={onSelectMenuItem}
            selectedMenuItem={selectedMenuItem}
          />
        </Drawer>
      </Hidden>
    </>
  )
);
