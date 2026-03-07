import { Box, Typography, Card, Grid, List, ListItem, ListItemText, Divider, TextField, Button, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useState } from 'react';

const mockChats = [
    { id: '1', user: 'Roshan Perera (Tech)', lastMsg: 'I cannot open the attachment.', time: '10:42 AM', unread: true },
    { id: '2', user: 'Householder Amara', lastMsg: 'Thank you for the refund.', time: 'Yesterday', unread: false },
    { id: '3', user: 'System Alert', lastMsg: 'Failed to dispatch Job #892.', time: 'Yesterday', unread: false },
];

const mockThread = [
    { sender: 'user', text: 'Hi, I got suspended but I submitted my NVQ!', time: '10:40 AM' },
    { sender: 'user', text: 'I cannot open the attachment in the welcome text.', time: '10:42 AM' },
];

const Support = () => {
    const [message, setMessage] = useState('');
    const [thread, setThread] = useState(mockThread);

    const handleSend = () => {
        if (!message.trim()) return;
        setThread([...thread, { sender: 'admin', text: message, time: 'Just now' }]);
        setMessage('');
    };

    return (
        <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="700">Support & QA messaging</Typography>
            </Box>

            <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
                {/* Chat List */}
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search conversations by User ID..."
                                variant="outlined"
                            />
                        </Box>
                        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                            {mockChats.map((chat, idx) => (
                                <Box key={chat.id}>
                                    <ListItem
                                        button
                                        sx={{
                                            p: 2,
                                            backgroundColor: chat.unread ? 'rgba(0,102,255,0.05)' : 'transparent',
                                            borderLeft: chat.unread ? '4px solid #0066FF' : '4px solid transparent'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography fontWeight={chat.unread ? 700 : 600}>{chat.user}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{chat.time}</Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                                    {chat.lastMsg}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    {idx < mockChats.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    </Card>
                </Grid>

                {/* Chat Thread */}
                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>R</Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="600">Roshan Perera (Tech)</Typography>
                                <Typography variant="caption" color="text.secondary">Tech ID: 18a4-92b1 | via SMS Gateway</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, backgroundColor: '#fdfdfd' }}>
                            {thread.map((msg, idx) => {
                                const isAdmin = msg.sender === 'admin';
                                return (
                                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', mb: 3 }}>
                                        <Box sx={{
                                            maxWidth: '70%',
                                            p: 2,
                                            borderRadius: 2,
                                            borderBottomRightRadius: isAdmin ? 0 : 8,
                                            borderTopLeftRadius: isAdmin ? 8 : 0,
                                            backgroundColor: isAdmin ? 'primary.main' : 'grey.200',
                                            color: isAdmin ? '#fff' : 'text.primary'
                                        }}>
                                            <Typography variant="body1">{msg.text}</Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mx: 1 }}>{msg.time}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Type an SMS reply..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    endIcon={<SendIcon />}
                                    onClick={handleSend}
                                    disabled={!message.trim()}
                                >
                                    Send
                                </Button>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Replies are dispatched instantly to the user's registered phone number via the simulated SMS API.
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Support;
