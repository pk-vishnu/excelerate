import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { Record } from '../types/Record';
import isUpcomingEvent from '../utils/upcomingDate';


export const configure = ()=> {
    PushNotification.configure({
      onRegister: function (token:any) {
        console.log('TOKEN:', token);
      },

      onNotification: function (notification:any) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  }

export const createChannel = ()=> {
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default notification channel',
        soundName: 'default',
        importance: 4,
        vibrate: false,
      },
      (created:any) => console.log(`Notification channel created: ${created}`)
    );
  }

  /**
   * Schedule a daily notification at 9 AM if there are upcoming records
   * @param records List of your records
   */
export const scheduleDailyNotificationWithRecords = (records: Record[])=>{
    const upcomingRecords = records.filter((r) => isUpcomingEvent(r.date));
    if (upcomingRecords.length === 0) {
      console.log('No upcoming records, skipping notification schedule.');
      PushNotification.cancelLocalNotification({ id: '123' });
      return;
    }
    const message = upcomingRecords
      .map((r) => `${r.item} due on ${r.date}`)
      .join('\n');

    // Cancel any previous notification with this ID
    PushNotification.cancelLocalNotification({ id: '123' });

    const now = new Date();
    const notifDate = new Date();
    notifDate.setHours(9, 0, 0, 0);
    // If 9 AM today already passed, schedule for tomorrow
    if (notifDate <= now) {
      notifDate.setDate(notifDate.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      id: '123', // fixed ID to manage one notification
      channelId: 'default-channel-id',
      title: 'You have upcoming Events!',
      message,
      date: notifDate,
      repeatType: 'day',
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      vibrate: false,
    });

    console.log(`Scheduled daily notification at ${notifDate} with message:\n${message}`);
}

export const sendTestNotification = () => {
    PushNotification.localNotification({
      channelId: 'default-channel-id',
      title: 'Test Notification',
      message: 'This is a test notification',
      playSound: true,
      soundName: 'default',
      vibrate: true,
    });
  }
