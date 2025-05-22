import React, { useState } from 'react';
import { Main, Button, ProgressBar, Box, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState('');

  // 通用处理函数
  const handleAction = async (url) => {
    try {
      setIsLoading(true);
      setProgress(0);
      setProgressText('准备同步...');
      setMessage('');

      const res = await post(url);
      
      // 解析返回的消息，提取进度信息
      if (res.data?.message) {
        const lines = res.data.message.split('\n');
        const progressLine = lines.find(line => line.includes('推送状态:'));
        if (progressLine) {
          const progressInfo = progressLine.replace('推送状态:', '').trim();
          setProgressText(progressInfo);
          
          // 根据进度信息更新进度条
          if (progressInfo.includes('Counting objects')) {
            setProgress(20);
          } else if (progressInfo.includes('Compressing objects')) {
            setProgress(40);
          } else if (progressInfo.includes('Writing objects')) {
            setProgress(60);
          } else if (progressInfo.includes('Resolving deltas')) {
            setProgress(80);
          } else if (progressInfo === '完成') {
            setProgress(100);
          }
        }
      }

      setMessage(res.data?.message || '操作成功');
    } catch (error) {
      setMessage(error.message || '操作失败');
      setProgress(0);
      setProgressText('同步失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Main>
      <h1>Welcome to {formatMessage({ id: getTranslation('plugin.name') })}</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => handleAction('/export-to-hugo/content-type-generator')}>Content-Type生成器</Button>
        <Button onClick={() => handleAction('/export-to-hugo/hugo-file-generator')}>Hugo文件生成器</Button>
        <Button onClick={() => handleAction('/export-to-hugo/sync-to-github')} disabled={isLoading}>
          {isLoading ? '同步中...' : '同步到服务器'}
        </Button>
      </div>
      {isLoading && (
        <Box paddingTop={4}>
          <ProgressBar value={progress} />
          <Typography variant="pi" textColor="neutral600" style={{ marginTop: 8 }}>
            {progressText}
          </Typography>
        </Box>
      )}
      {message && (
        <Box paddingTop={4}>
          <Typography variant="pi" textColor="neutral800" style={{ whiteSpace: 'pre-line' }}>
            {message}
          </Typography>
        </Box>
      )}
    </Main>
  );
};

export { HomePage };