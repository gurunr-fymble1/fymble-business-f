import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(currentPage + 1, totalPages - 1);
      if (start > 2) {
        pages.push('...');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <View style={paginationStyles.container}>
      <TouchableOpacity
        style={[
          paginationStyles.navButton,
          currentPage === 1 && paginationStyles.disabledButton,
        ]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Icon
          name="chevron-left"
          size={20}
          color={currentPage === 1 ? '#adb5bd' : '#22426B'}
        />
      </TouchableOpacity>

      {getPageNumbers().map((page, index) =>
        page === '...' ? (
          <Text key={`ellipsis-${index}`} style={paginationStyles.ellipsis}>
            ...
          </Text>
        ) : (
          <TouchableOpacity
            key={`page-${page}`}
            style={[
              paginationStyles.pageButton,
              currentPage === page && paginationStyles.activePageButton,
            ]}
            onPress={() => onPageChange(page)}
            disabled={currentPage === page}
          >
            <Text
              style={[
                paginationStyles.pageText,
                currentPage === page && paginationStyles.activePageText,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        )
      )}

      <TouchableOpacity
        style={[
          paginationStyles.navButton,
          currentPage === totalPages && paginationStyles.disabledButton,
        ]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Icon
          name="chevron-right"
          size={20}
          color={currentPage === totalPages ? '#adb5bd' : '#22426B'}
        />
      </TouchableOpacity>
    </View>
  );
};

export default PaginationControls;

const paginationStyles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderColor: '#e9ecef',
    paddingTop: 12,
    paddingBottom: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  navButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  pageButton: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activePageButton: {
    backgroundColor: '#22426B',
    borderColor: '#22426B',
  },
  pageText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  activePageText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#f1f3f5',
    borderColor: '#e9ecef',
  },
  ellipsis: {
    paddingHorizontal: 8,
    alignSelf: 'center',
    color: '#6c757d',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 6,
  },
  loaderContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
});
