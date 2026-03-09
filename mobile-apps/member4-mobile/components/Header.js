import React from 'react';
import { Appbar } from 'react-native-paper';

export default function Header({ title, leftAction }) {
  return (
    <Appbar.Header elevated>
      {leftAction}
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
}
