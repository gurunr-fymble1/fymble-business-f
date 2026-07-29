import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import ClientItem from './ClientItem';

const ClientList = ({ clients }) => {
  // Memoized render function for better performance
  const renderItem = useCallback(({ item }) => (
    <ClientItem client={item} />
  ), []);

  // Optimized key extractor using unique client ID
  const keyExtractor = useCallback((item, index) => {
    // Use unique identifier, fallback to index only if no ID exists
    return item?.client_id?.toString() || item?.id?.toString() || `client-${index}`;
  }, []);

  return (
    <FlatList
      data={clients}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      // Performance optimizations
      initialNumToRender={7}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      // onEndReached={loadMoreClients}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 10,
    // height: 500,
  },
});

export default ClientList;
