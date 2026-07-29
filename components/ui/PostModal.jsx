import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  TextInput,
  Keyboard,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  createCommentPostAPI,
  deleteCommentAPI,
  deletePostAPI,
  editPostAPI,
  getCommentPostAPI,
} from "../../services/Api";
import { Alert } from "react-native";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";

const { width, height } = Dimensions.get("window");

const PostModal = ({ post, visible, onClose, getAllPosts }) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const [modalVisibleEdit, setModalVisibleEdit] = useState(false);
  const [comments, setComments] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const translateY = useRef(new Animated.Value(height)).current;
  const [commentId, setCommentId] = useState(null);
  const flatListRef = useRef(null);

  const getAllComments = async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await getCommentPostAPI(
        gymId,
        post.post_id,
        null,
        "owner"
      );
      if (response?.status === 200) {
        setComments(response?.data);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const handlePostComment = async () => {
    if (newComment.trim() === "") {
      showToast({
        type: "error",
        title: "Please enter some text to comment",
      });
      return;
    }
    const gymId = await getToken("gym_id");
    const payload = {
      content: newComment,
      gym_id: gymId,
      post_id: post.post_id,
      client_id: null,
      role: "owner",
    };
    try {
      const response = await createCommentPostAPI(payload);
      if (response?.status === 200) {
        await getAllComments();
        await getAllPosts();
        setNewComment("");
        Keyboard.dismiss();
        // Scroll to the bottom to show new comment
        if (flatListRef.current && comments?.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const onEdit = async () => {
    setModalVisibleEdit(true);
    setPostContent(post.content);
  };

  const onDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => handleDelete(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = async () => {
    const gymId = await getToken("gym_id");
    try {
      const response = await deletePostAPI(gymId, post.post_id);
      if (response?.status === 200) {
        await getAllPosts();
        onClose();
        Keyboard.dismiss();
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const editMyPost = async () => {
    if (postContent.trim() === "") {
      showToast({
        type: "error",
        title: "Please enter some text",
      });
      return;
    }
    const gymId = await getToken("gym_id");
    const payload = {
      content: postContent,
      gym_id: gymId,
      post_id: post.post_id,
      client_id: null,
      role: "owner",
    };

    try {
      const response = await editPostAPI(payload);
      if (response?.status === 200) {
        setPostContent(null);
        setModalVisibleEdit(false);
        await getAllPosts();
        onClose();
        Keyboard.dismiss();
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  const onDeleteComment = (comment) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          onPress: () => setCommentId(null),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => handleDeleteComment(comment.comment_id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteComment = async (id) => {
    try {
      const response = await deleteCommentAPI(id);
      if (response?.status === 200) {
        await getAllComments();
        await getAllPosts();
        setCommentId(null);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      const errorMessage = "Something went wrong, please try again.";
      showToast({
        type: "error",
        title: errorMessage,
      });
    }
  };

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    getAllComments();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!modalVisible) return null;

  return (
    <Animated.View
      style={[styles.modalContainer, { transform: [{ translateY }] }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerText}>View Post</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={comments || []}
          keyExtractor={(item) => item?.comment_id || Math.random().toString()}
          ListHeaderComponent={
            <View style={styles.postContent}>
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{post?.user_name}</Text>
                  <Text style={styles.userHandle}>
                    {formatDate(post?.created_at)}
                  </Text>
                </View>
                {post.is_editable && (
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={onEdit}
                    >
                      <Ionicons
                        name="pencil"
                        size={width * 0.05}
                        color="#FF5757"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={onDelete}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={width * 0.05}
                        color="#FF5757"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.postText}>{post?.content}</Text>

              <View style={styles.postActions}>
                <View style={styles.actionSection}>
                  <MaterialIcons
                    name={post?.is_liked ? "favorite" : "favorite-border"}
                    size={24}
                    color={post?.is_liked ? "#FF5757" : "#555"}
                  />
                  <Text style={styles.actionText}>
                    {post?.like_count} Likes
                  </Text>
                </View>
                <View style={styles.actionSection}>
                  <MaterialIcons name="comment" size={24} color="#555" />
                  <Text style={styles.actionText}>
                    {comments?.length || 0} Comments
                  </Text>
                </View>
              </View>

              <Text style={styles.commentsHeader}>Comments</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>{item.user_name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
              </View>
              {item.is_editable && (
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => onDeleteComment(item)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={width * 0.05}
                      color="#FF5757"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            loading && <Text style={styles.loadingText}>Loading...</Text>
          }
          contentContainerStyle={styles.flatListContent}
        />

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={styles.postButton}
            onPress={handlePostComment}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisibleEdit}
          onRequestClose={() => setModalVisibleEdit(false)}
        >
          <View style={styles.modalContainerEdit}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Post</Text>
              <TextInput
                style={styles.input}
                placeholder="Edit Post"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                autoFocus
                scrollEnabled
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={editMyPost}
                >
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setPostContent(null);
                    setModalVisibleEdit(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F7F7F7",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#FF5757",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    paddingLeft: 10,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  flatListContent: {
    flexGrow: 1,
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.02,
    paddingVertical: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: width * 0.045,
    fontWeight: "600",
  },
  userHandle: {
    fontSize: width * 0.035,
    color: "#666",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: width * 0.03,
  },
  iconButton: {
    padding: width * 0.02,
    borderRadius: width * 0.02,
    backgroundColor: "#f0f0f0",
  },
  postText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 8,
    paddingHorizontal: width * 0.03,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    paddingVertical: 8,
  },
  actionSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  commentsHeader: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  comment: {
    paddingVertical: 8,
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
  },
  commentText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  loadingText: {
    padding: 16,
    textAlign: "center",
    color: "#999",
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: "#FF5757",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainerEdit: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "white",
    borderRadius: 10,
    padding: width * 0.05,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
    height: height * 0.2,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#FF5757",
    padding: width * 0.03,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  modalButtonText: {
    color: "white",
    fontSize: width * 0.04,
  },
});

export default PostModal;
