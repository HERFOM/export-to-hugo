import React, { useState } from 'react';
import { Main, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFetchClient } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();
  const [message, setMessage] = useState('');

  // 通用处理函数
  const handleAction = async (url) => {
    try {
      const res = await post(url);
      setMessage(res.data?.message || '操作成功');
    } catch {
      setMessage('操作失败');
    }
  };

  return (
    <Main>
      <h1>Welcome to {formatMessage({ id: getTranslation('plugin.name') })}</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => handleAction('/export-to-hugo/content-type-generator')}>Content-Type生成器</Button>
        <Button onClick={() => handleAction('/export-to-hugo/update-website-files')}>更新网站文件</Button>
        <Button onClick={() => handleAction('/export-to-hugo/sync-to-server')}>同步到服务器</Button>
      </div>
      {message && <div>{message}</div>}
    </Main>
  );
};

export { HomePage };