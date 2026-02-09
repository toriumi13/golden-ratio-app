import React, { useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Portal, Dialog } from 'react-native-paper';

interface SimpleDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (value: string) => void;
    title: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
}

export default function SimpleTextDialog({
    visible,
    onDismiss,
    onSubmit,
    title,
    label,
    placeholder,
    multiline = false
}: SimpleDialogProps) {
    const inputRef = useRef<RNTextInput>(null);
    const [text, setText] = React.useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss}>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text variant="labelMedium" style={{ marginBottom: 4 }}>{label}</Text>
                    <RNTextInput
                        ref={inputRef}
                        value={text}
                        onChangeText={setText}
                        placeholder={placeholder}
                        multiline={multiline}
                        numberOfLines={multiline ? 3 : 1}
                        style={[
                            styles.input,
                            multiline && { height: 80, textAlignVertical: 'top' }
                        ]}
                        returnKeyType="done"
                        blurOnSubmit
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => { setText(''); onDismiss(); }}>キャンセル</Button>
                    <Button onPress={handleSubmit}>追加</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
});
